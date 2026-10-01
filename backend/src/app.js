import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import eventRoutes from './routes/event.routes.js';
import adminEventRoutes from './routes/admin.event.routes.js';
import registrationRoutes from './routes/registration.routes.js';
import adminRegistrationRoutes from './routes/admin.registration.routes.js';
import highlightRoutes from './routes/highlight.routes.js';
import adminHighlightRoutes from './routes/admin.highlight.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import scoreRoutes from './routes/score.routes.js';
import tournamentRoutes from './routes/tournament.routes.js';
import matchSessionRoutes from './routes/matchSession.routes.js';
import errorHandler from './middlewares/error.middleware.js';
import { handleMulterError } from './utils/upload.js';
import ApiError from './utils/ApiError.js';

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, message: 'Turf Titans API is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/admin/events', adminEventRoutes);
app.use('/api/v1/registrations', registrationRoutes);
app.use('/api/v1/admin/registrations', adminRegistrationRoutes);
app.use('/api/v1/highlights', highlightRoutes);
app.use('/api/v1/admin/highlights', adminHighlightRoutes);
app.use('/api/v1/admin/dashboard', dashboardRoutes);
app.use('/api/v1/scores', scoreRoutes);
app.use('/api/v1/scores', matchSessionRoutes);
app.use('/api/v1/tournaments', tournamentRoutes);
app.use('/api/v1/admin/tournaments', tournamentRoutes);
app.use('/api/v1/matches', matchSessionRoutes);
app.use('/api/v1/admin/matches', matchSessionRoutes);

app.use((_req, _res, next) => {
  next(new ApiError(404, 'Route not found'));
});

app.use(handleMulterError);
app.use(errorHandler);

export default app;
