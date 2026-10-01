import dotenv from 'dotenv';
import connectDB from '../db/config.js';
import Admin from '../models/admin.model.js';

dotenv.config({ path: './.env' });

const testAdmins = [
    {
        username: 'Kushagra',
        email: 'kushagra0326@gmail.com',
        password: process.env.TEST_ADMIN_1_PASSWORD,
    },
    {
        username: 'Dhruv',
        email: 'dhruvsheth0708@gmail.com',
        password: process.env.TEST_ADMIN_2_PASSWORD,
    },
    {
        username: 'Pranjal',
        email: 'propranzyd@gmail.com',
        password: process.env.TEST_ADMIN_3_PASSWORD,
    },
];

const seedTestAdmins = async () => {
    await connectDB();

    try {
        for (const adminData of testAdmins) {
            if (!adminData.password) {
                console.error(
                    `Missing password for ${adminData.email} in .env`
                );
                continue;
            }

            const existing = await Admin.findOne({
                email: adminData.email,
            });

            if (existing) {
                console.log(`Admin already exists: ${adminData.email}`);
                continue;
            }

            const admin = new Admin({
                username: adminData.username,
                email: adminData.email,
                password: adminData.password,
                role: 'admin',
            });

            await admin.save();

            console.log(`Admin seeded successfully: ${adminData.email}`);
        }

        console.log('Test admin seeding completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating test admins:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
};

seedTestAdmins().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});