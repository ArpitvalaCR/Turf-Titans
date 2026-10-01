import dotenv from 'dotenv';
import connectDB from '../db/config.js';
import Admin from '../models/admin.model.js';
import Event from '../models/event.model.js';
import Highlight from '../models/highlight.model.js';

dotenv.config({ path: './.env' });

const sampleEvents = [
  {
    title: 'City Turf Cup',
    sport: 'football',
    description: 'Seven-a-side football tournament across Metro Arena.',
    location: 'Metro Arena, Downtown',
    venue: 'Metro Arena',
    startDate: new Date('2026-03-14'),
    endDate: new Date('2026-03-16'),
    registrationStartDate: new Date('2026-02-01'),
    registrationEndDate: new Date('2026-03-10'),
    registrationFee: 500,
    maxTeams: 24,
    prizes: '$40K',
    status: 'registration_open',
  },
  {
    title: 'Titan Showdown',
    sport: 'cricket',
    description: 'Premier cricket tournament at Riverside Grounds.',
    location: 'Riverside Grounds',
    venue: 'Riverside Grounds',
    startDate: new Date('2026-04-04'),
    endDate: new Date('2026-04-07'),
    registrationStartDate: new Date('2026-02-15'),
    registrationEndDate: new Date('2026-03-30'),
    registrationFee: 800,
    maxTeams: 16,
    prizes: '$75K',
    status: 'registration_open',
  },
  {
    title: 'Night League Finals',
    sport: 'badminton',
    description: 'Badminton finals under the lights at The Dome.',
    location: 'The Dome, Eastside',
    venue: 'The Dome',
    startDate: new Date('2026-05-22'),
    endDate: new Date('2026-05-24'),
    registrationStartDate: new Date('2026-03-01'),
    registrationEndDate: new Date('2026-05-15'),
    registrationFee: 300,
    maxTeams: 32,
    prizes: '$60K',
    status: 'registration_open',
  },
];

const sampleHighlights = [
  {
    title: 'Champions crowned',
    description: 'Team celebrating a victory under floodlights',
    mediaType: 'image',
    mediaUrl: '/images/highlight-2.png',
  },
  {
    title: 'Full-blooded tackles',
    description: 'Player sliding to tackle on green turf',
    mediaType: 'image',
    mediaUrl: '/images/highlight-1.png',
  },
  {
    title: 'Fingertip saves',
    description: 'Goalkeeper diving to make a save',
    mediaType: 'image',
    mediaUrl: '/images/highlight-3.png',
  },
  {
    title: 'Every angle covered',
    description: 'Aerial view of a five-a-side turf court',
    mediaType: 'image',
    mediaUrl: '/images/highlight-4.png',
  },
];

const seedSampleData = async () => {
  await connectDB();

  const admin = await Admin.findOne();
  if (!admin) {
    console.error('No admin found. Run npm run seed:admin first.');
    process.exit(1);
  }

  const existingEvents = await Event.countDocuments();
  if (existingEvents === 0) {
    await Event.insertMany(
      sampleEvents.map((event) => ({ ...event, createdBy: admin._id }))
    );
    console.log('Sample events seeded.');
  } else {
    console.log('Events already exist. Skipping event seed.');
  }

  const existingHighlights = await Highlight.countDocuments();
  if (existingHighlights === 0) {
    await Highlight.insertMany(
      sampleHighlights.map((highlight) => ({
        ...highlight,
        createdBy: admin._id,
      }))
    );
    console.log('Sample highlights seeded.');
  } else {
    console.log('Highlights already exist. Skipping highlight seed.');
  }

  process.exit(0);
};

seedSampleData().catch((err) => {
  console.error('Sample seed failed:', err.message);
  process.exit(1);
});
