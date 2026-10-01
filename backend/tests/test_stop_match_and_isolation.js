import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Registration from '../src/models/registration.model.js';
import Group from '../src/models/group.model.js';
import Fixture from '../src/models/fixture.model.js';
import MatchSession from '../src/models/matchSession.model.js';
import Event from '../src/models/event.model.js';
import { endMatch } from '../src/controllers/matchSession.controller.js';

async function runTests() {
  console.log('--- STARTING VERIFICATION TESTS ---');
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || 'turf_titans'
  });
  console.log('Connected to MongoDB.');

  try {
    // 1. Verify Fake Data Cleanup & Genuine Data Preservation
    console.log('\n[1] Checking Database State:');
    const registrations = await Registration.find({}).lean();
    console.log(`Total active registrations: ${registrations.length}`);
    const teamNames = registrations.map(r => r.teamName);
    console.log('Team names in DB:', teamNames);

    // Verify none of the fake names are present
    const fakeKeywords = ['Apex', 'Vortex', 'Warriors XI', 'Mumbai Titans', 'PT Team', 'Live Team', 'E2E Team'];
    const hasFake = registrations.some(r => fakeKeywords.some(k => r.teamName.includes(k)));
    if (hasFake) {
      throw new Error('FAILED: Fake team names found in database!');
    } else {
      console.log('PASS: Zero fake/demo teams found in database.');
    }

    // 2. Stop Match Test
    console.log('\n[2] Testing Stop Match Logic:');
    // Create a dummy live match session to test stopping
    const dummyFixture = new Fixture({
      tournamentId: 'turf-titans-2025',
      groupName: 'Group A',
      team1: 'Team Alpha',
      team2: 'Team Beta',
      date: '2026-09-30',
      time: '14:00',
      status: 'LIVE',
      matchType: 'LEAGUE',
      totalOvers: 6
    });
    await dummyFixture.save();

    const dummySession = new MatchSession({
      matchId: dummyFixture._id.toString(),
      fixtureId: dummyFixture._id,
      tournamentId: 'turf-titans-2025',
      groupName: 'Group A',
      team1Squad: { teamName: 'Team Alpha', players: [] },
      team2Squad: { teamName: 'Team Beta', players: [] },
      matchConfig: { totalOvers: 6, ballsPerOver: 6 },
      currentInningsIndex: 0,
      innings: [
        {
          inningsNumber: 1,
          battingTeam: 'Team Alpha',
          bowlingTeam: 'Team Beta',
          status: 'IN_PROGRESS',
          totalRuns: 24,
          totalWickets: 1,
          overs: 2.1,
          currentOver: { overNumber: 3, balls: [] }
        }
      ],
      state: 'IN_PROGRESS'
    });
    await dummySession.save();

    // Call endMatch controller directly with mock req/res
    const req = {
      params: { matchId: dummyFixture._id.toString() },
      headers: {},
      user: { _id: new mongoose.Types.ObjectId() },
      body: {
        action: 'STOPPED',
        stoppedReason: 'Technical Error',
        stoppedDetails: 'Power outage at pitch'
      }
    };
    let responseStatus = null;
    let responseJson = null;

    await new Promise((resolve, reject) => {
      const res = {
        status(code) {
          responseStatus = code;
          return this;
        },
        json(data) {
          responseJson = data;
          resolve(data);
          return this;
        }
      };
      endMatch(req, res, (err) => {
        if (err) reject(err);
      });
    });

    console.log('EndMatch Response Status:', responseStatus);
    console.log('EndMatch Response Body:', responseJson);

    if (responseStatus !== 200 || !responseJson?.success) {
      throw new Error(`FAILED: Stop match failed with status ${responseStatus}`);
    }

    // Verify persisted session & match state
    const updatedSession = await MatchSession.findById(dummySession._id);
    const updatedFixture = await Fixture.findById(dummyFixture._id);

    console.log('Updated Session Status:', updatedSession.status);
    console.log('Updated Session StoppedReason:', updatedSession.stoppedReason);
    console.log('Updated Fixture Status:', updatedFixture.status);
    console.log('Updated Fixture StoppedReason:', updatedFixture.stoppedReason);

    if (updatedSession.status !== 'STOPPED' || updatedSession.stoppedReason !== 'Technical Error' || updatedSession.stoppedDetails !== 'Power outage at pitch') {
      throw new Error('FAILED: Session status or stoppedReason mismatch!');
    }
    if (updatedFixture.status !== 'STOPPED' || updatedFixture.stoppedReason !== 'Technical Error') {
      throw new Error('FAILED: Fixture status or stoppedReason mismatch!');
    }
    console.log('PASS: Stop Match persisted status=STOPPED and stoppedReason successfully without validation error.');

    // 3. Tournament Team Data Isolation Test
    console.log('\n[3] Testing Strict Tournament Data Isolation:');
    const testEventSlug = 'test-tournament-isolation-' + Date.now();
    const testEvent = new Event({
      title: 'Tournament Isolation Test Event',
      slug: testEventSlug,
      description: 'Testing team isolation',
      sport: 'cricket',
      location: 'Ahmedabad',
      venue: 'North Arena Pitch 1',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      registrationStartDate: new Date(),
      registrationEndDate: new Date(Date.now() + 86400000),
      registrationFee: 1000,
      maxTeams: 16,
      prizes: '1st: 5000',
      createdBy: new mongoose.Types.ObjectId(),
      status: 'upcoming'
    });
    await testEvent.save();

    // Import controllers/services to test isolation logic
    const { getTournamentGroups, getRegisteredTeams } = await import('../src/controllers/tournament.controller.js');
    const { getRegistrations } = await import('../src/services/registration.service.js');

    // Query registrations for the new tournament
    const newTourneyRegistrations = await getRegistrations({ eventId: testEvent._id.toString() });
    console.log(`Tournament B initial registrations count: ${newTourneyRegistrations.registrations?.length || 0}`);
    if ((newTourneyRegistrations.registrations?.length || 0) !== 0) {
      throw new Error('FAILED: New tournament leaked existing registrations!');
    }

    // Query approved registered teams for the new tournament
    const regTeamsReq = { params: { tournamentId: testEvent._id.toString() } };
    let regTeamsJson = null;
    await new Promise((resolve) => {
      const res = {
        status() { return this; },
        json(data) { regTeamsJson = data; resolve(data); return this; }
      };
      getRegisteredTeams(regTeamsReq, res, () => resolve(null));
    });
    console.log(`Tournament B approved registered teams count: ${regTeamsJson?.data?.length || 0}`);
    if ((regTeamsJson?.data?.length || 0) !== 0) {
      throw new Error('FAILED: New tournament leaked approved registered teams!');
    }

    // Query groups for the new tournament
    const groupReq = { params: { tournamentId: testEvent._id.toString() } };
    let groupStatus = null;
    let groupJson = null;
    await new Promise((resolve) => {
      const res = {
        status(code) { groupStatus = code; return this; },
        json(data) { groupJson = data; resolve(data); return this; }
      };
      getTournamentGroups(groupReq, res, () => resolve(null));
    });

    const returnedGroups = groupJson?.data || [];
    const totalTeamsInGroups = returnedGroups.reduce((acc, g) => acc + (g.teams?.length || 0), 0);
    console.log(`Tournament B group count: ${returnedGroups.length}, teams in groups: ${totalTeamsInGroups}`);
    if (totalTeamsInGroups !== 0) {
      throw new Error('FAILED: New tournament groups leaked teams from other tournaments!');
    }

    console.log('PASS: Strict Tournament Isolation confirmed — new tournament has 0 teams and 0 leaked registrations.');

    // Cleanup test event
    await Event.findByIdAndDelete(testEvent._id);

    console.log('\n--- ALL VERIFICATION TESTS PASSED ---');
  } catch (err) {
    console.error('Test Error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
