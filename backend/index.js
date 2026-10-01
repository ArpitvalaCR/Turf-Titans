import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/db/config.js';
import { initAdminAccount } from './src/services/auth.service.js';

dotenv.config({ path: './.env' });

const PORT = process.env.PORT || 8000;

connectDB()
  .then(async () => {
    await initAdminAccount();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
