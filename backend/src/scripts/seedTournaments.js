import dotenv from 'dotenv';
import connectDB from '../db/config.js';
import Admin from '../models/admin.model.js';
import Event from '../models/event.model.js';

dotenv.config({ path: './.env' });

const initialTournaments = [
  {
    title: 'Turf Titans 2025 — Box Cricket Championship',
    sport: 'cricket',
    description: 'The flagship tape-ball box cricket tournament of Mumbai. Featuring 20 elite teams in a 4-group format leading into knockout quarter-finals and grand finale.',
    location: 'Mira Road East, Mumbai',
    venue: 'Lush Turf Arena (Twin Floodlit Courts)',
    startDate: new Date('2026-10-11'),
    endDate: new Date('2026-10-12'),
    registrationStartDate: new Date('2026-08-01'),
    registrationEndDate: new Date('2026-10-05'),
    registrationFee: 3000,
    maxTeams: 20,
    prizes: '₹35,000 + Trophies',
    status: 'registration_open',
    rules: 'Strict 5 overs per side with maximum 1 over per bowler throughout the innings. Side wall deflections score +2 runs; direct full hit on rear top scores +4 runs.',
  },
  {
    title: 'Turf Titans 5v5 Futsal Championship',
    sport: 'football',
    description: 'Fast-paced 5v5 turf football tournament with continuous rebound walls. 16 squads competing in fast 15-minute halves with rolling substitutions on certified turf.',
    location: 'Mira Road East, Mumbai',
    venue: 'Lush Arena Pitch 1 & 2',
    startDate: new Date('2026-10-19'),
    endDate: new Date('2026-10-20'),
    registrationStartDate: new Date('2026-08-10'),
    registrationEndDate: new Date('2026-10-15'),
    registrationFee: 3500,
    maxTeams: 16,
    prizes: '₹40,000 + Golden Cup',
    status: 'registration_open',
    rules: '15 minutes each half with rolling substitutions. No offsides; back-pass rule strictly enforced for goalkeepers.',
  },
];

const seedTournaments = async () => {
  await connectDB();

  let admin = await Admin.findOne();
  if (!admin) {
    console.error('No admin found. Please run seed:admin first.');
    process.exit(1);
  }

  for (const t of initialTournaments) {
    const exists = await Event.findOne({ title: t.title });
    if (!exists) {
      await Event.create({
        ...t,
        createdBy: admin._id,
      });
      console.log(`Created tournament: ${t.title}`);
    } else {
      console.log(`Tournament already exists: ${t.title}`);
    }
  }

  console.log('Tournaments seed check completed.');
  process.exit(0);
};

seedTournaments().catch((err) => {
  console.error('Seed tournaments failed:', err);
  process.exit(1);
});
