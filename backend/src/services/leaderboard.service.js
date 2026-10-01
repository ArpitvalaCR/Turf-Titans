import mongoose from 'mongoose';
import Registration from '../models/registration.model.js';
import Fixture from '../models/fixture.model.js';
import Score from '../models/score.model.js';
import MatchSession from '../models/matchSession.model.js';
import { oversToBalls } from './pointsTable.service.js';

/**
 * Calculates Tournament Leaderboard and MVP Impact standings.
 * Sourced strictly from registered rosters and completed match performances.
 */
export async function calculateTournamentLeaderboard(tournamentId, { category = 'batting', statistic = 'top_run_scorer', team = 'ALL' } = {}) {
  // 1. Fetch all registered teams and their players for this tournament
  let query = {};
  if (mongoose.Types.ObjectId.isValid(tournamentId)) {
    query = { eventId: tournamentId };
  }

  const registrations = await Registration.find(query).select('teamName players');

  // Map to store aggregated player statistics
  // Key: "teamName:::playerName" (lowercase)
  const playerStatsMap = new Map();

  // Initialize player records from registered rosters
  for (const reg of registrations) {
    const teamName = reg.teamName.trim();
    const players = reg.players || [];

    for (const p of players) {
      const playerName = (p.name || '').trim();
      if (!playerName) continue;

      const key = `${teamName.toLowerCase()}:::${playerName.toLowerCase()}`;
      playerStatsMap.set(key, {
        playerName,
        teamName,
        role: p.role || 'Player',
        jerseyNumber: p.jerseyNumber || '',
        
        // Batting Stats
        inningsBatted: 0,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        fifties: 0,
        centuries: 0,
        highestScore: 0,
        highestScoreNotOut: false,
        dismissals: 0,

        // Bowling Stats
        inningsBowled: 0,
        ballsBowled: 0,
        runsConceded: 0,
        wickets: 0,
        maidens: 0,
        dotBalls: 0,
        wides: 0,
        noBalls: 0,
        bestBowlingWickets: 0,
        bestBowlingRuns: 999,

        // Fielding Stats
        catches: 0,
        stumpings: 0,
        runOutsDirect: 0,
        runOutsAssisted: 0,
        isWicketKeeper: (p.role || '').toLowerCase().includes('keeper'),

        // Matches
        matchesPlayed: 0,
      });
    }
  }

  // 2. Fetch completed fixtures and match sessions for this tournament
  const completedFixtures = await Fixture.find({
    tournamentId,
    status: { $in: ['COMPLETED', 'completed'] },
  });

  const completedMatchIds = completedFixtures.map((f) => f.matchId).filter(Boolean);

  let matchSessions = [];
  let legacyScores = [];

  if (completedMatchIds.length > 0) {
    [matchSessions, legacyScores] = await Promise.all([
      MatchSession.find({ matchId: { $in: completedMatchIds } }),
      Score.find({ matchId: { $in: completedMatchIds } }),
    ]);
  }

  // Track match IDs processed via MatchSession so we don't double count legacy scores
  const processedMatchIds = new Set();

  for (const session of matchSessions) {
    processedMatchIds.add(session.matchId);

    // Process all innings in the session
    for (const inn of session.innings || []) {
      const batTeam = inn.battingTeam || '';
      const bowlTeam = inn.bowlingTeam || '';

      // 1. Batting Scorecards
      for (const b of inn.battingScorecard || []) {
        const key = `${batTeam.trim().toLowerCase()}:::${b.playerName.trim().toLowerCase()}`;
        const stat = playerStatsMap.get(key);
        if (stat) {
          if (b.ballsFaced > 0 || b.runs > 0 || b.isOut) {
            stat.inningsBatted += 1;
          }
          stat.runs += Number(b.runs || 0);
          stat.ballsFaced += Number(b.ballsFaced || 0);
          stat.fours += Number(b.fours || 0);
          stat.sixes += Number(b.sixes || 0);

          if (b.isOut) {
            stat.dismissals += 1;
          }

          if (b.runs >= 100) stat.centuries += 1;
          else if (b.runs >= 50) stat.fifties += 1;

          if (b.runs > stat.highestScore) {
            stat.highestScore = b.runs;
            stat.highestScoreNotOut = !b.isOut;
          }
        }
      }

      // 2. Bowling Scorecards
      for (const bow of inn.bowlingScorecard || []) {
        const key = `${bowlTeam.trim().toLowerCase()}:::${bow.playerName.trim().toLowerCase()}`;
        const stat = playerStatsMap.get(key);
        if (stat) {
          const balls = Number(bow.ballsBowled || 0);
          const runsConceded = Number(bow.runsConceded || 0);
          const wickets = Number(bow.wickets || 0);

          if (balls > 0) {
            stat.inningsBowled += 1;
          }
          stat.ballsBowled += balls;
          stat.runsConceded += runsConceded;
          stat.wickets += wickets;
          stat.maidens += Number(bow.maidens || 0);
          stat.dotBalls += Number(bow.dotBalls || 0);
          stat.wides += Number(bow.wides || 0);
          stat.noBalls += Number(bow.noBalls || 0);

          if (wickets > stat.bestBowlingWickets || (wickets === stat.bestBowlingWickets && runsConceded < stat.bestBowlingRuns)) {
            stat.bestBowlingWickets = wickets;
            stat.bestBowlingRuns = runsConceded;
          }
        }
      }

      // 3. Fielding events (Catches, Stumpings, Run Outs)
      for (const evt of inn.events || []) {
        if (evt.isWicket && evt.dismissal) {
          const d = evt.dismissal;
          if (d.dismissalType === 'CAUGHT' && d.fielderCatcher) {
            const fKey = `${bowlTeam.trim().toLowerCase()}:::${d.fielderCatcher.trim().toLowerCase()}`;
            const fStat = playerStatsMap.get(fKey);
            if (fStat) fStat.catches += 1;
          } else if (d.dismissalType === 'CAUGHT_BEHIND' && (d.wicketKeeper || d.fielderCatcher)) {
            const wkName = d.wicketKeeper || d.fielderCatcher;
            const fKey = `${bowlTeam.trim().toLowerCase()}:::${wkName.trim().toLowerCase()}`;
            const fStat = playerStatsMap.get(fKey);
            if (fStat) fStat.catches += 1;
          } else if (d.dismissalType === 'STUMPED' && (d.wicketKeeper || d.fielderCatcher)) {
            const wkName = d.wicketKeeper || d.fielderCatcher;
            const fKey = `${bowlTeam.trim().toLowerCase()}:::${wkName.trim().toLowerCase()}`;
            const fStat = playerStatsMap.get(fKey);
            if (fStat) fStat.stumpings += 1;
          } else if (d.dismissalType === 'RUN_OUT' && d.runOutDetails) {
            if (d.runOutDetails.thrower) {
              const throwKey = `${bowlTeam.trim().toLowerCase()}:::${d.runOutDetails.thrower.trim().toLowerCase()}`;
              const throwStat = playerStatsMap.get(throwKey);
              if (throwStat) {
                if (d.runOutDetails.isDirectHit) {
                  throwStat.runOutsDirect += 1;
                } else {
                  throwStat.runOutsAssisted += 1;
                }
              }
            }
            if (d.runOutDetails.assistingFielder && !d.runOutDetails.isDirectHit) {
              const assistKey = `${bowlTeam.trim().toLowerCase()}:::${d.runOutDetails.assistingFielder.trim().toLowerCase()}`;
              const assistStat = playerStatsMap.get(assistKey);
              if (assistStat) assistStat.runOutsAssisted += 1;
            }
          }
        }
      }
    }
  }

  // Fallback for legacy Score records
  for (const scoreDoc of legacyScores) {
    if (processedMatchIds.has(scoreDoc.matchId)) continue;

    if (scoreDoc.striker?.name) {
      const strikerKey = `${(scoreDoc.battingTeam || '').trim().toLowerCase()}:::${scoreDoc.striker.name.trim().toLowerCase()}`;
      let stat = playerStatsMap.get(strikerKey);
      if (stat) {
        stat.inningsBatted += 1;
        const runs = Number(scoreDoc.striker.runs || 0);
        const balls = Number(scoreDoc.striker.balls || 0);
        const fours = Number(scoreDoc.striker.fours || 0);
        const sixes = Number(scoreDoc.striker.sixes || 0);

        stat.runs += runs;
        stat.ballsFaced += balls;
        stat.fours += fours;
        stat.sixes += sixes;

        if (runs >= 100) stat.centuries += 1;
        else if (runs >= 50) stat.fifties += 1;

        if (runs > stat.highestScore) {
          stat.highestScore = runs;
          stat.highestScoreNotOut = true;
        }
      }
    }

    if (scoreDoc.bowler?.name) {
      const bowlerKey = `${(scoreDoc.bowlingTeam || '').trim().toLowerCase()}:::${scoreDoc.bowler.name.trim().toLowerCase()}`;
      let stat = playerStatsMap.get(bowlerKey);
      if (stat) {
        stat.inningsBowled += 1;
        const balls = oversToBalls(scoreDoc.bowler.overs || '0.0');
        const runsConceded = Number(scoreDoc.bowler.runsConceded || 0);
        const wickets = Number(scoreDoc.bowler.wickets || 0);

        stat.ballsBowled += balls;
        stat.runsConceded += runsConceded;
        stat.wickets += wickets;

        if (wickets > stat.bestBowlingWickets || (wickets === stat.bestBowlingWickets && runsConceded < stat.bestBowlingRuns)) {
          stat.bestBowlingWickets = wickets;
          stat.bestBowlingRuns = runsConceded;
        }
      }
    }
  }

  // Convert map to array
  let allPlayers = Array.from(playerStatsMap.values());

  // Filter by team if specified
  if (team && team !== 'ALL') {
    allPlayers = allPlayers.filter(
      (p) => p.teamName.trim().toLowerCase() === team.trim().toLowerCase()
    );
  }

  // Calculate derived metrics & format based on category and statistic
  const normalizedCategory = (category || 'batting').toLowerCase();
  const normalizedStatistic = (statistic || 'top_run_scorer').toLowerCase();

  let formattedList = [];

  if (normalizedCategory === 'batting') {
    formattedList = allPlayers.map((p) => {
      const strikeRate = p.ballsFaced > 0 ? (p.runs / p.ballsFaced) * 100 : 0.0;
      const battingAverage = p.dismissals > 0 ? p.runs / p.dismissals : p.runs;

      let value = 0;
      let displayValue = '0';

      switch (normalizedStatistic) {
        case 'top_run_scorer':
        case 'runs':
          value = p.runs;
          displayValue = String(p.runs);
          break;
        case 'highest_individual_score':
        case 'highest_score':
          value = p.highestScore;
          displayValue = `${p.highestScore}${p.highestScoreNotOut ? '*' : ''}`;
          break;
        case 'highest_strike_rate':
        case 'strike_rate':
          value = strikeRate;
          displayValue = strikeRate.toFixed(2);
          break;
        case 'highest_batting_average':
        case 'average':
          value = battingAverage;
          displayValue = p.dismissals === 0 && p.runs > 0 ? `${battingAverage.toFixed(2)}*` : battingAverage.toFixed(2);
          break;
        case 'most_sixes':
        case 'sixes':
          value = p.sixes;
          displayValue = String(p.sixes);
          break;
        case 'most_fours':
        case 'fours':
          value = p.fours;
          displayValue = String(p.fours);
          break;
        case 'most_fifties':
        case 'fifties':
          value = p.fifties;
          displayValue = String(p.fifties);
          break;
        case 'most_centuries':
        case 'centuries':
          value = p.centuries;
          displayValue = String(p.centuries);
          break;
        default:
          value = p.runs;
          displayValue = String(p.runs);
      }

      // Minimum participation qualification for rate statistics
      let qualified = true;
      if (['highest_strike_rate', 'strike_rate'].includes(normalizedStatistic) && p.ballsFaced < 15) {
        qualified = false;
      }
      if (['highest_batting_average', 'average'].includes(normalizedStatistic) && p.inningsBatted < 2) {
        qualified = false;
      }

      return {
        player: p.playerName,
        team: p.teamName,
        role: p.role,
        value,
        displayValue,
        qualified,
        supporting: {
          innings: p.inningsBatted,
          runs: p.runs,
          balls: p.ballsFaced,
          fours: p.fours,
          sixes: p.sixes,
          strikeRate: strikeRate.toFixed(2),
          average: p.dismissals === 0 && p.runs > 0 ? `${battingAverage.toFixed(2)}*` : battingAverage.toFixed(2),
        },
      };
    });

    // Sorting
    formattedList.sort((a, b) => {
      if (a.qualified !== b.qualified) return a.qualified ? -1 : 1;
      if (b.value !== a.value) return b.value - a.value;
      if (b.supporting.runs !== a.supporting.runs) return b.supporting.runs - a.supporting.runs;
      return a.player.localeCompare(b.player);
    });

  } else if (normalizedCategory === 'bowling') {
    formattedList = allPlayers.map((p) => {
      const oversDecimal = p.ballsBowled / 6;
      const economy = oversDecimal > 0 ? p.runsConceded / oversDecimal : 0.0;
      const bowlingAverage = p.wickets > 0 ? p.runsConceded / p.wickets : 999.0;
      const bowlingStrikeRate = p.wickets > 0 ? p.ballsBowled / p.wickets : 999.0;

      let value = 0;
      let displayValue = '0';
      let lowerIsBetter = false;

      switch (normalizedStatistic) {
        case 'most_wickets':
        case 'wickets':
          value = p.wickets;
          displayValue = String(p.wickets);
          break;
        case 'best_bowling_average':
        case 'bowling_average':
          value = bowlingAverage;
          displayValue = p.wickets > 0 ? bowlingAverage.toFixed(2) : '—';
          lowerIsBetter = true;
          break;
        case 'best_economy':
        case 'economy':
          value = economy;
          displayValue = p.ballsBowled > 0 ? economy.toFixed(2) : '—';
          lowerIsBetter = true;
          break;
        case 'best_bowling_strike_rate':
        case 'bowling_strike_rate':
          value = bowlingStrikeRate;
          displayValue = p.wickets > 0 ? bowlingStrikeRate.toFixed(2) : '—';
          lowerIsBetter = true;
          break;
        case 'highest_wickets_in_an_innings':
        case 'best_figures':
          value = p.bestBowlingWickets * 1000 - (p.bestBowlingRuns === 999 ? 0 : p.bestBowlingRuns);
          displayValue = p.bestBowlingWickets > 0 ? `${p.bestBowlingWickets}/${p.bestBowlingRuns}` : '0/0';
          break;
        case 'most_maiden_overs':
        case 'maidens':
          value = p.maidens;
          displayValue = String(p.maidens);
          break;
        case 'most_dot_balls':
        case 'dot_balls':
          value = p.dotBalls;
          displayValue = String(p.dotBalls);
          break;
        default:
          value = p.wickets;
          displayValue = String(p.wickets);
      }

      // Minimum participation qualification for rate statistics
      let qualified = true;
      if (['best_economy', 'economy'].includes(normalizedStatistic) && p.ballsBowled < 12) {
        qualified = false;
      }
      if (['best_bowling_average', 'bowling_average', 'best_bowling_strike_rate', 'bowling_strike_rate'].includes(normalizedStatistic) && p.wickets < 2) {
        qualified = false;
      }

      const oversStr = `${Math.floor(p.ballsBowled / 6)}.${p.ballsBowled % 6}`;

      return {
        player: p.playerName,
        team: p.teamName,
        role: p.role,
        value,
        displayValue,
        qualified,
        lowerIsBetter,
        supporting: {
          overs: oversStr,
          runsConceded: p.runsConceded,
          wickets: p.wickets,
          economy: p.ballsBowled > 0 ? economy.toFixed(2) : '0.00',
          average: p.wickets > 0 ? bowlingAverage.toFixed(2) : '—',
          strikeRate: p.wickets > 0 ? bowlingStrikeRate.toFixed(2) : '—',
          maidens: p.maidens,
          dotBalls: p.dotBalls,
        },
      };
    });

    // Sorting
    formattedList.sort((a, b) => {
      if (a.qualified !== b.qualified) return a.qualified ? -1 : 1;
      if (a.lowerIsBetter) {
        if (a.value !== b.value) return a.value - b.value;
      } else {
        if (b.value !== a.value) return b.value - a.value;
      }
      if (b.supporting.wickets !== a.supporting.wickets) return b.supporting.wickets - a.supporting.wickets;
      return a.player.localeCompare(b.player);
    });

  } else if (normalizedCategory === 'fielding') {
    formattedList = allPlayers.map((p) => {
      const totalDismissals = p.catches + p.stumpings + p.runOutsDirect + p.runOutsAssisted;
      const wkDismissals = p.catches + p.stumpings;

      let value = 0;
      let displayValue = '0';

      switch (normalizedStatistic) {
        case 'most_dismissals':
        case 'dismissals':
          value = totalDismissals;
          displayValue = String(totalDismissals);
          break;
        case 'most_catches':
        case 'catches':
          value = p.catches;
          displayValue = String(p.catches);
          break;
        case 'most_stumpings':
        case 'stumpings':
          value = p.stumpings;
          displayValue = String(p.stumpings);
          break;
        case 'most_run_outs':
        case 'run_outs':
          value = p.runOutsDirect;
          displayValue = String(p.runOutsDirect);
          break;
        case 'most_assisted_run_outs':
        case 'assisted_run_outs':
          value = p.runOutsAssisted;
          displayValue = String(p.runOutsAssisted);
          break;
        case 'best_wicket_keeper':
        case 'wicket_keeper':
          value = p.isWicketKeeper ? wkDismissals : 0;
          displayValue = String(wkDismissals);
          break;
        default:
          value = totalDismissals;
          displayValue = String(totalDismissals);
      }

      return {
        player: p.playerName,
        team: p.teamName,
        role: p.role,
        value,
        displayValue,
        qualified: true,
        supporting: {
          catches: p.catches,
          stumpings: p.stumpings,
          directRunOuts: p.runOutsDirect,
          assistedRunOuts: p.runOutsAssisted,
          totalDismissals,
        },
      };
    });

    // Sorting
    formattedList.sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      if (b.supporting.catches !== a.supporting.catches) return b.supporting.catches - a.supporting.catches;
      return a.player.localeCompare(b.player);
    });

  } else if (normalizedCategory === 'mvp' || normalizedCategory === 'impact') {
    // 4. MVP / Impact Calculation
    formattedList = allPlayers.map((p) => {
      // Batting Impact (BI)
      let bi = p.runs * 1.0 + p.fours * 1.0 + p.sixes * 2.0;
      if (p.ballsFaced >= 4) {
        const sr = (p.runs / p.ballsFaced) * 100;
        bi += (sr - 150) / 25;
      }
      if (p.runs >= 50) bi += 12.0;
      else if (p.runs >= 25) bi += 5.0;
      if (p.dismissals > 0 && p.runs === 0 && p.ballsFaced <= 3) bi -= 4.0;

      // Bowling Impact (WI)
      let wi = p.wickets * 22.0 + p.dotBalls * 2.5 + p.maidens * 15.0;
      if (p.ballsBowled >= 6) {
        const econ = p.runsConceded / (p.ballsBowled / 6);
        wi += (11.0 - econ) * 2.0;
      }
      wi -= (p.wides + p.noBalls) * 1.5;

      // Fielding Impact (FI)
      const fi = p.catches * 8.0 + p.runOutsDirect * 12.0 + p.runOutsAssisted * 6.0 + p.stumpings * 10.0;

      const totalImpact = Math.max(0, Number((bi + wi + fi).toFixed(2)));

      return {
        player: p.playerName,
        team: p.teamName,
        role: p.role,
        value: totalImpact,
        displayValue: totalImpact.toFixed(2),
        qualified: true,
        supporting: {
          battingImpact: Number(bi.toFixed(2)),
          bowlingImpact: Number(wi.toFixed(2)),
          fieldingImpact: Number(fi.toFixed(2)),
          runs: p.runs,
          wickets: p.wickets,
          catches: p.catches,
        },
      };
    });

    // Sorting
    formattedList.sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      if (b.supporting.runs !== a.supporting.runs) return b.supporting.runs - a.supporting.runs;
      if (b.supporting.wickets !== a.supporting.wickets) return b.supporting.wickets - a.supporting.wickets;
      return a.player.localeCompare(b.player);
    });
  }

  // Assign clean 1-based ranks
  const rankedResults = formattedList.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));

  return {
    tournamentId,
    category: normalizedCategory,
    statistic: normalizedStatistic,
    team: team || 'ALL',
    standings: rankedResults,
  };
}
