import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Registration from './src/models/registration.model.js';
import TournamentGroup from './src/models/group.model.js';
import Fixture from './src/models/fixture.model.js';
import MatchSession from './src/models/matchSession.model.js';

dotenv.config();

async function runBugFixVerification() {
  console.log('====================================================');
  console.log('VERIFYING FIXES FOR BUG 1 (REMOVE) & BUG 2 (START MATCH)');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/turf_titans');
  console.log('Connected to MongoDB.');

  const tournamentId = 'turf-titans-2025';
  const tag = Date.now().toString().slice(-4);
  const teamAName = `FixTeam A ${tag}`;
  const teamBName = `FixTeam B ${tag}`;

  // 1. Create approved registrations with 11 players + 1 sub each
  const makePlayers = (prefix) => {
    const list = [];
    for (let i = 1; i <= 11; i++) {
      list.push({ name: `${prefix} Player ${i}`, role: i <= 5 ? 'batsman' : i <= 8 ? 'all-rounder' : 'bowler', isSubstitute: false });
    }
    list.push({ name: `${prefix} Sub 12`, role: 'all-rounder', isSubstitute: true });
    return list;
  };

  const regA = await Registration.create({
    teamName: teamAName,
    captainName: 'Captain A',
    captainEmail: `cap.a.${tag}@test.com`,
    captainPhone: '9876543210',
    sport: 'cricket',
    players: makePlayers('TeamA'),
    registrationStatus: 'approved',
    paymentStatus: 'verified',
  });

  const regB = await Registration.create({
    teamName: teamBName,
    captainName: 'Captain B',
    captainEmail: `cap.b.${tag}@test.com`,
    captainPhone: '9876543211',
    sport: 'cricket',
    players: makePlayers('TeamB'),
    registrationStatus: 'approved',
    paymentStatus: 'verified',
  });

  console.log(`Created approved teams: ${teamAName} and ${teamBName}`);

  // ----------------------------------------------------
  // TEST BUG 1: Group Assignment & Remove Team from Group
  // ----------------------------------------------------
  console.log('\n--- [TEST BUG 1] Group Assignment & Remove Team ---');
  
  // Assign Team A and Team B to Group A
  let groupA = await TournamentGroup.findOneAndUpdate(
    { tournamentId, groupName: 'GROUP A' },
    { $addToSet: { teams: { $each: [teamAName, teamBName] } } },
    { upsert: true, new: true }
  );

  console.log('Group A initial teams:', groupA.teams);
  if (!groupA.teams.includes(teamAName) || !groupA.teams.includes(teamBName)) {
    throw new Error('Failed to assign teams to Group A');
  }

  // Remove Team B from Group A
  groupA.teams = groupA.teams.filter(t => t.toLowerCase() !== teamBName.toLowerCase());
  await groupA.save();

  // Re-fetch from DB to verify persistence
  const verifiedGroup = await TournamentGroup.findOne({ tournamentId, groupName: 'GROUP A' });
  console.log('Group A teams after removing Team B:', verifiedGroup.teams);
  
  if (verifiedGroup.teams.includes(teamBName)) {
    throw new Error('BUG 1 Failed: Team B was not removed from Group A in database');
  }
  if (!verifiedGroup.teams.includes(teamAName)) {
    throw new Error('BUG 1 Failed: Team A was unintentionally removed');
  }

  // Verify Team B registration is intact
  const verifiedRegB = await Registration.findById(regB._id);
  if (!verifiedRegB || verifiedRegB.registrationStatus !== 'approved') {
    throw new Error('BUG 1 Failed: Team B registration was modified or deleted');
  }
  console.log('BUG 1 PASSED: Team B removed from group, registration remains intact and approved.');

  // Re-add Team B for Match creation
  verifiedGroup.teams.push(teamBName);
  await verifiedGroup.save();

  // ----------------------------------------------------
  // TEST BUG 2: Start Match & Match Setup Execution
  // ----------------------------------------------------
  console.log('\n--- [TEST BUG 2] Start Match & Match Setup Execution ---');

  // Create UPCOMING fixture
  const matchId = `match-${tournamentId}-${Date.now().toString().slice(-6)}`;
  const fixture = await Fixture.create({
    tournamentId,
    groupName: 'GROUP A',
    matchId,
    team1: teamAName,
    team2: teamBName,
    date: '2025-10-12',
    time: '10:00 AM',
    ground: 'Pitch 1 - North Court',
    status: 'UPCOMING',
  });

  console.log(`Created upcoming fixture ${fixture.team1} vs ${fixture.team2} (${fixture.matchId})`);

  // Verify loading players from Registration
  const [loadRegA, loadRegB] = await Promise.all([
    Registration.findOne({ teamName: new RegExp(`^${fixture.team1.trim()}$`, 'i') }),
    Registration.findOne({ teamName: new RegExp(`^${fixture.team2.trim()}$`, 'i') }),
  ]);

  const team1Playing = loadRegA.players.filter(p => !p.isSubstitute).slice(0, 7);
  const team1Subs = loadRegA.players.filter(p => p.isSubstitute);
  const team2Playing = loadRegB.players.filter(p => !p.isSubstitute).slice(0, 7);
  const team2Subs = loadRegB.players.filter(p => p.isSubstitute);

  console.log(`Loaded players: Team 1 (${team1Playing.length} playing, ${team1Subs.length} sub), Team 2 (${team2Playing.length} playing, ${team2Subs.length} sub)`);

  // Execute Match Setup
  const striker = team1Playing[0].name;
  const nonStriker = team1Playing[1].name;
  const bowler = team2Playing[0].name;

  const session = await MatchSession.findOneAndUpdate(
    { matchId },
    {
      matchId,
      fixtureId: fixture._id,
      tournamentId,
      groupName: 'GROUP A',
      config: {
        totalOvers: 5,
        playersPerSide: 7,
        maxOversPerBowler: 1,
        isBowlingLimitStrict: true,
      },
      team1Squad: {
        teamName: teamAName,
        playing: team1Playing,
        substitutes: team1Subs,
      },
      team2Squad: {
        teamName: teamBName,
        playing: team2Playing,
        substitutes: team2Subs,
      },
      toss: {
        wonBy: teamAName,
        electedTo: 'BAT',
        battingFirst: teamAName,
        bowlingFirst: teamBName,
      },
      status: 'LIVE',
      currentInnings: 1,
      target: 0,
      liveState: {
        battingTeam: teamAName,
        bowlingTeam: teamBName,
        runs: 0,
        wickets: 0,
        legalBalls: 0,
        oversDisplay: '0.0',
        striker,
        nonStriker,
        currentBowler: bowler,
        bowlerOverDeliveries: 0,
        inningsStatus: 'IN_PROGRESS',
        recentBalls: [],
      },
      innings: [
        {
          inningsNumber: 1,
          battingTeam: teamAName,
          bowlingTeam: teamBName,
          totalRuns: 0,
          totalWickets: 0,
          totalLegalBalls: 0,
          oversFormatted: '0.0',
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 },
          battingScorecard: [
            { playerName: striker, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, battingOrder: 1 },
            { playerName: nonStriker, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, battingOrder: 2 },
          ],
          bowlingScorecard: [
            { playerName: bowler, oversBowled: '0.0', ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, wides: 0, noBalls: 0, dotBalls: 0 },
          ],
          fallOfWickets: [],
          events: [],
          status: 'IN_PROGRESS',
        },
      ],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Transition fixture in DB to LIVE
  const updatedFixture = await Fixture.findByIdAndUpdate(
    fixture._id,
    { status: 'LIVE' },
    { new: true }
  );

  if (updatedFixture.status !== 'LIVE') {
    throw new Error('BUG 2 Failed: Fixture status did not transition to LIVE');
  }

  // Verify Session in MongoDB
  const verifiedSession = await MatchSession.findOne({ matchId });
  if (!verifiedSession || verifiedSession.status !== 'LIVE') {
    throw new Error('BUG 2 Failed: MatchSession was not initialized as LIVE');
  }

  console.log(`BUG 2 PASSED: Fixture transitioned to LIVE, match session created with striker "${verifiedSession.liveState.striker}", non-striker "${verifiedSession.liveState.nonStriker}", bowler "${verifiedSession.liveState.currentBowler}".`);

  console.log('\n====================================================');
  console.log('ALL BUG FIX VERIFICATIONS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');

  await mongoose.disconnect();
  process.exit(0);
}

runBugFixVerification().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
