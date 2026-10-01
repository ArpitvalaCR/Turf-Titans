import dotenv from 'dotenv';
import connectDB from '../db/config.js';
import Admin from '../models/admin.model.js';

dotenv.config({ path: './.env' });

const seedAdmin = async () => {
  const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      'Missing ADMIN_USERNAME, ADMIN_EMAIL, or ADMIN_PASSWORD in .env'
    );
    process.exit(1);
  }

  await connectDB();

  const existing = await Admin.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    console.log('Admin already exists:', ADMIN_EMAIL);
    process.exit(0);
  }

  try {
    const admin = new Admin({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });
    
    await admin.save();

    console.log('Admin seeded successfully:', ADMIN_EMAIL);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

seedAdmin().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
