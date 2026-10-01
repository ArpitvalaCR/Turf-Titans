import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import Registration from '../src/models/registration.model.js';
import TournamentGroup from '../src/models/group.model.js';
import Fixture from '../src/models/fixture.model.js';
import Event from '../src/models/event.model.js';
import MatchSession from '../src/models/matchSession.model.js';
import Score from '../src/models/score.model.js';
import User from '../src/models/user.model.js';

import connectDB from '../src/db/config.js';

import {
  getRegisteredTeams,
  createTournamentGroup,
  assignTeamToGroup,
  saveTournamentGroup,
} from '../src/controllers/tournament.controller.js';
import { approveRegistration } from '../src/services/registration.service.js';
import { getLiveMatchesList } from '../src/controllers/matchSession.controller.js';

async function runTests() {
  console.log('=== STARTING LIVE MATCHES & GROUPS VALIDATION TESTS ===');
  await connectDB();
  console.log('Connected to MongoDB:', mongoose.connection.name);

  try {
    // 0. Clean test artifacts
    await Event.deleteMany({ title: { $in: ['Test Tournament Alpha', 'Test Tournament Beta'] } });
    await Registration.deleteMany({ teamName: { $in: ['Alpha Tigers', 'Alpha Lions', 'Beta Wolves'] } });
    await TournamentGroup.deleteMany({ tournamentId: { $in: ['test-alpha-tourney', 'test-beta-tourney', 'turf-titans-2025'] } });

    const dummyAdminId = new mongoose.Types.ObjectId();

    // 1. Create 2 test events
    const eventAlpha = await Event.create({
      title: 'Test Tournament Alpha',
      sport: 'cricket',
      description: 'Alpha tournament for isolation testing',
      location: 'Mumbai',
      venue: 'Turf Alpha',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 5),
      registrationStartDate: new Date(),
      registrationEndDate: new Date(Date.now() + 86400000 * 2),
      registrationFee: 2000,
      maxTeams: 16,
      prizes: 'Trophy + 50,000 INR',
      status: 'upcoming',
      createdBy: dummyAdminId,
    });

    const eventBeta = await Event.create({
      title: 'Test Tournament Beta',
      sport: 'cricket',
      description: 'Beta tournament for isolation testing',
      location: 'Mumbai',
      venue: 'Turf Beta',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 5),
      registrationStartDate: new Date(),
      registrationEndDate: new Date(Date.now() + 86400000 * 2),
      registrationFee: 2000,
      maxTeams: 16,
      prizes: 'Trophy + 30,000 INR',
      status: 'upcoming',
      createdBy: dummyAdminId,
    });

    console.log(`✓ Created events: Alpha ID=${eventAlpha._id}, Beta ID=${eventBeta._id}`);

    // 2. Submit registrations (pending)
    const regAlpha1 = await Registration.create({
      registrationId: 'TT-TEST-101',
      eventId: eventAlpha._id,
      teamName: 'Alpha Tigers',
      captainName: 'Virat',
      captainEmail: 'virat.test@alpha.com',
      sport: 'cricket',
      registrationStatus: 'pending',
    });

    const regAlpha2 = await Registration.create({
      registrationId: 'TT-TEST-102',
      eventId: eventAlpha._id,
      teamName: 'Alpha Lions',
      captainName: 'Rohit',
      captainEmail: 'rohit.test@alpha.com',
      sport: 'cricket',
      registrationStatus: 'pending',
    });

    const regBeta1 = await Registration.create({
      registrationId: 'TT-TEST-201',
      eventId: eventBeta._id,
      teamName: 'Beta Wolves',
      captainName: 'Hardik',
      captainEmail: 'hardik.test@beta.com',
      sport: 'cricket',
      registrationStatus: 'pending',
    });

    console.log('✓ Created 3 pending registrations (2 in Alpha, 1 in Beta)');

    // Mock Express res helper
    const mockRes = () => {
      const res = {};
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.body = data;
        return res;
      };
      return res;
    };

    const callHandler = (handler, req, res) =>
      new Promise((resolve, reject) => {
        const next = (err) => {
          if (err) reject(err);
          else resolve(res);
        };
        const origJson = res.json;
        res.json = (data) => {
          origJson(data);
          resolve(res);
        };
        handler(req, res, next);
      });

    // 3. Test: Prior to approval, getRegisteredTeams for Alpha must return 0 teams
    let reqAlpha = { params: { tournamentId: eventAlpha._id.toString() } };
    let resAlpha = mockRes();
    await callHandler(getRegisteredTeams, reqAlpha, resAlpha);
    console.log(`✓ Unapproved teams check: Alpha has ${resAlpha.body.data.length} approved teams (expected: 0)`);
    if (resAlpha.body.data.length !== 0) throw new Error('Pending teams should NOT appear in groups!');

    // 4. Admin approves Alpha Tigers and Beta Wolves
    await approveRegistration(regAlpha1._id, dummyAdminId);
    await approveRegistration(regBeta1._id, dummyAdminId);
    console.log('✓ Approved Alpha Tigers (in Tournament Alpha) and Beta Wolves (in Tournament Beta)');

    // 5. Test: getRegisteredTeams for Tournament Alpha (by ObjectId)
    reqAlpha = { params: { tournamentId: eventAlpha._id.toString() } };
    resAlpha = mockRes();
    await callHandler(getRegisteredTeams, reqAlpha, resAlpha);
    const alphaTeams = resAlpha.body.data;
    console.log(`✓ Alpha approved teams: ${alphaTeams.map(t => t.teamName).join(', ')}`);
    if (alphaTeams.length !== 1 || alphaTeams[0].teamName !== 'Alpha Tigers') {
      throw new Error('Expected only Alpha Tigers to appear in Tournament Alpha!');
    }

    // 6. Test: getRegisteredTeams for Tournament Beta (by ObjectId)
    let reqBeta = { params: { tournamentId: eventBeta._id.toString() } };
    let resBeta = mockRes();
    await callHandler(getRegisteredTeams, reqBeta, resBeta);
    const betaTeams = resBeta.body.data;
    console.log(`✓ Beta approved teams: ${betaTeams.map(t => t.teamName).join(', ')}`);
    if (betaTeams.length !== 1 || betaTeams[0].teamName !== 'Beta Wolves') {
      throw new Error('Expected only Beta Wolves to appear in Tournament Beta!');
    }

    // 7. Test: Assign Alpha Tigers to Group A in Tournament Alpha
    const reqAssign = {
      params: { tournamentId: eventAlpha._id.toString(), groupName: 'GROUP A' },
      body: { teamName: 'Alpha Tigers' },
      admin: { _id: dummyAdminId },
    };
    const resAssign = mockRes();
    await callHandler(assignTeamToGroup, reqAssign, resAssign);
    console.log(`✓ Assigned Alpha Tigers to GROUP A in Tournament Alpha:`, resAssign.body.data.teams);

    // 8. Test: Attempting to assign Beta Wolves to Tournament Alpha must be rejected
    const reqInvalidAssign = {
      params: { tournamentId: eventAlpha._id.toString(), groupName: 'GROUP A' },
      body: { teamName: 'Beta Wolves' },
      admin: { _id: dummyAdminId },
    };
    const resInvalidAssign = mockRes();
    let rejectedAsExpected = false;
    try {
      await callHandler(assignTeamToGroup, reqInvalidAssign, resInvalidAssign);
    } catch (err) {
      rejectedAsExpected = true;
      console.log(`✓ Cross-tournament assignment correctly rejected: "${err.message}"`);
    }
    if (!rejectedAsExpected) throw new Error('Beta Wolves should NOT be assignable to Tournament Alpha!');

    // 9. Test: Approve second Alpha team (Alpha Lions) and verify it appears as eligible
    await approveRegistration(regAlpha2._id, dummyAdminId);
    resAlpha = mockRes();
    await callHandler(getRegisteredTeams, reqAlpha, resAlpha);
    console.log(`✓ After approving Alpha Lions, total Alpha teams: ${resAlpha.body.data.length}`);
    if (resAlpha.body.data.length !== 2) throw new Error('Expected 2 approved teams in Alpha now!');

    // 10. Test: Live Matches query
    const resLive = mockRes();
    await callHandler(getLiveMatchesList, {}, resLive);
    console.log(`✓ Live matches API returned ${resLive.body.data.length} matches`);

    // Clean up
    await Event.deleteMany({ _id: { $in: [eventAlpha._id, eventBeta._id] } });
    await Registration.deleteMany({ _id: { $in: [regAlpha1._id, regAlpha2._id, regBeta1._id] } });
    await TournamentGroup.deleteMany({ tournamentId: { $in: [eventAlpha._id.toString(), eventBeta._id.toString()] } });

    console.log('\n=========================================');
    console.log('✅ ALL TESTS PASSED SUCCESSFULLY! 100%');
    console.log('=========================================');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
