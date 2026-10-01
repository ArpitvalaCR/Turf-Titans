import TournamentGroup from '../models/group.model.js';
import Fixture from '../models/fixture.model.js';
import Registration from '../models/registration.model.js';

/**
 * Converts cricket overs string (e.g. "4.2", "5.0", "5", 5.4) to total balls.
 * 4.2 overs = 4 overs * 6 balls + 2 balls = 26 balls.
 */
export function oversToBalls(oversInput) {
  if (oversInput === null || oversInput === undefined || oversInput === '') {
    return 0;
  }
  const str = String(oversInput).trim();
  const parts = str.split('.');
  const overs = parseInt(parts[0], 10) || 0;
  const balls = parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;
  return overs * 6 + balls;
}

/**
 * Converts total balls back to cricket overs string notation (e.g. 26 balls -> "4.2").
 */
export function ballsToOversStr(balls) {
  const overs = Math.floor(balls / 6);
  const remainder = balls % 6;
  return `${overs}.${remainder}`;
}

/**
 * Calculates Points Table group-wise for a tournament.
 * Future-ready: parses completed match fixtures with exact cricket NRR calculation.
 * Zero completed matches returns 0s for all stats without fake data.
 */
export async function calculateTournamentPointsTable(tournamentId) {
  // 1. Fetch all groups defined for this tournament
  const groups = await TournamentGroup.find({ tournamentId }).sort({ groupName: 1 });

  // 2. Fetch all completed fixtures for this tournament
  const completedFixtures = await Fixture.find({
    tournamentId,
    status: { $in: ['COMPLETED', 'completed'] },
  });

  // 3. Fetch registered team logos for quick lookup
  const registeredTeams = await Registration.find({}).select('teamName teamLogo');
  const logoMap = new Map();
  registeredTeams.forEach((r) => {
    if (r.teamName && r.teamLogo) {
      logoMap.set(r.teamName.trim().toLowerCase(), r.teamLogo);
    }
  });

  const groupResults = [];

  for (const group of groups) {
    const groupName = group.groupName;
    const teams = group.teams || [];

    // Initialize team stats map for all assigned registered teams
    const teamStatsMap = new Map();

    for (const team of teams) {
      teamStatsMap.set(team.trim().toLowerCase(), {
        team: team.trim(),
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        points: 0,
        runsScored: 0,
        ballsFaced: 0,
        runsConceded: 0,
        ballsBowled: 0,
        nrr: '+0.000',
        nrrValue: 0,
      });
    }

    // Filter completed fixtures belonging to this group
    const groupFixtures = completedFixtures.filter(
      (f) => f.groupName?.trim().toUpperCase() === groupName.trim().toUpperCase()
    );

    for (const match of groupFixtures) {
      const team1Key = match.team1?.trim().toLowerCase();
      const team2Key = match.team2?.trim().toLowerCase();

      const t1Stats = teamStatsMap.get(team1Key);
      const t2Stats = teamStatsMap.get(team2Key);

      // Only process if both teams exist in this group
      if (!t1Stats || !t2Stats) continue;

      t1Stats.played += 1;
      t2Stats.played += 1;

      const t1Runs = Number(match.score?.team1Runs || 0);
      const t2Runs = Number(match.score?.team2Runs || 0);
      const t1Wickets = Number(match.score?.team1Wickets || 0);
      const t2Wickets = Number(match.score?.team2Wickets || 0);

      // Default allotted overs for turf matches is 5.0 (30 balls) unless specified
      const matchAllottedBalls = oversToBalls(match.maxOvers || '5.0');

      let t1BallsFaced = oversToBalls(match.score?.team1Overs || '0.0');
      let t2BallsFaced = oversToBalls(match.score?.team2Overs || '0.0');

      // Standard Cricket NRR Rule:
      // If a team is all out before completing its allotted overs, full allotted quota is counted for overs faced
      const isTeam1AllOut = t1Wickets >= 10 || (match.allOutWickets && t1Wickets >= match.allOutWickets);
      const isTeam2AllOut = t2Wickets >= 10 || (match.allOutWickets && t2Wickets >= match.allOutWickets);

      if (isTeam1AllOut && matchAllottedBalls > 0) {
        t1BallsFaced = matchAllottedBalls;
      }
      if (isTeam2AllOut && matchAllottedBalls > 0) {
        t2BallsFaced = matchAllottedBalls;
      }

      // Accumulate cumulative runs and cumulative balls across all completed matches
      t1Stats.runsScored += t1Runs;
      t1Stats.ballsFaced += t1BallsFaced;
      t1Stats.runsConceded += t2Runs;
      t1Stats.ballsBowled += t2BallsFaced;

      t2Stats.runsScored += t2Runs;
      t2Stats.ballsFaced += t2BallsFaced;
      t2Stats.runsConceded += t1Runs;
      t2Stats.ballsBowled += t1BallsFaced;


      // Determine match result
      const resultStr = (match.result || '').toLowerCase();

      if (resultStr.includes('tie') || (t1Runs === t2Runs && t1Runs > 0)) {
        t1Stats.tied += 1;
        t2Stats.tied += 1;
        t1Stats.points += 1;
        t2Stats.points += 1;
      } else if (resultStr.includes(team1Key) || t1Runs > t2Runs) {
        t1Stats.won += 1;
        t2Stats.lost += 1;
        t1Stats.points += 2;
      } else if (resultStr.includes(team2Key) || t2Runs > t1Runs) {
        t2Stats.won += 1;
        t1Stats.lost += 1;
        t2Stats.points += 2;
      }
    }

    // Calculate NRR for each team
    const standings = Array.from(teamStatsMap.values()).map((stat) => {
      let nrrValue = 0;

      if (stat.ballsFaced > 0 && stat.ballsBowled > 0) {
        const oversFacedDecimal = stat.ballsFaced / 6;
        const oversBowledDecimal = stat.ballsBowled / 6;

        const battingRate = stat.runsScored / oversFacedDecimal;
        const bowlingRate = stat.runsConceded / oversBowledDecimal;

        nrrValue = battingRate - bowlingRate;
      } else if (stat.ballsFaced > 0) {
        const oversFacedDecimal = stat.ballsFaced / 6;
        nrrValue = stat.runsScored / oversFacedDecimal;
      }

      const formattedNrr =
        nrrValue > 0
          ? `+${nrrValue.toFixed(3)}`
          : nrrValue < 0
          ? nrrValue.toFixed(3)
          : '+0.000';

      return {
        team: stat.team,
        teamLogo: logoMap.get(stat.team.toLowerCase()) || null,
        played: stat.played,
        won: stat.won,
        lost: stat.lost,
        tied: stat.tied,
        points: stat.points,
        runsScored: stat.runsScored,
        oversFaced: ballsToOversStr(stat.ballsFaced),
        runsConceded: stat.runsConceded,
        oversBowled: ballsToOversStr(stat.ballsBowled),
        nrr: formattedNrr,
        nrrValue,
      };
    });

    // Sort standings: Points (DESC) -> NRR (DESC) -> Wins (DESC) -> Team Name (ASC)
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.nrrValue !== a.nrrValue) return b.nrrValue - a.nrrValue;
      if (b.won !== a.won) return b.won - a.won;
      return a.team.localeCompare(b.team);
    });

    // Remove internal nrrValue before returning
    const cleanedStandings = standings.map(({ nrrValue, ...rest }) => rest);

    groupResults.push({
      groupName,
      standings: cleanedStandings,
    });
  }

  return groupResults;
}
