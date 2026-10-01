import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import connectDB from '../src/db/config.js';
import Registration from '../src/models/registration.model.js';
import TournamentGroup from '../src/models/group.model.js';
import Fixture from '../src/models/fixture.model.js';
import Event from '../src/models/event.model.js';
import MatchSession from '../src/models/matchSession.model.js';
import Score from '../src/models/score.model.js';
import User from '../src/models/user.model.js';

async function inspectDB() {
  await connectDB();
  console.log('=== DATABASE CONTENT INSPECTION ===\n');

  const events = await Event.find({}).select('title sport status createdAt');
  console.log('--- EVENTS (' + events.length + ') ---');
  events.forEach(e => console.log(`ID: ${e._id}, Title: "${e.title}", Sport: ${e.sport}`));

  const registrations = await Registration.find({}).select('registrationId teamName captainName captainEmail registrationStatus eventId createdAt');
  console.log('\n--- REGISTRATIONS (' + registrations.length + ') ---');
  registrations.forEach(r => console.log(`ID: ${r._id}, RegId: ${r.registrationId}, Team: "${r.teamName}", Captain: "${r.captainName}" (${r.captainEmail}), Status: ${r.registrationStatus}, EventId: ${r.eventId}`));

  const groups = await TournamentGroup.find({});
  console.log('\n--- TOURNAMENT GROUPS (' + groups.length + ') ---');
  groups.forEach(g => console.log(`TourneyId: ${g.tournamentId}, Group: "${g.groupName}", Teams: [${g.teams.join(', ')}]`));

  const fixtures = await Fixture.find({}).select('tournamentId groupName matchNumber matchTitle team1 team2 status matchId');
  console.log('\n--- FIXTURES (' + fixtures.length + ') ---');
  fixtures.forEach(f => console.log(`ID: ${f._id}, MatchId: ${f.matchId}, Tourney: ${f.tournamentId}, Group: ${f.groupName}, Teams: "${f.team1}" vs "${f.team2}", Status: ${f.status}`));

  const matchSessions = await MatchSession.find({}).select('matchId tournamentId groupName status team1Squad.teamName team2Squad.teamName stoppedReason');
  console.log('\n--- MATCH SESSIONS (' + matchSessions.length + ') ---');
  matchSessions.forEach(m => console.log(`MatchId: ${m.matchId}, Tourney: ${m.tournamentId}, Teams: "${m.team1Squad?.teamName}" vs "${m.team2Squad?.teamName}", Status: ${m.status}`));

  await mongoose.disconnect();
}

inspectDB();
