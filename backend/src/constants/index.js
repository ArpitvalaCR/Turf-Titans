export const SPORTS = [
  'cricket',
  'football',
  'badminton',
  'pickleball',
  'snooker',
  'chess',
  'basketball',
  'volleyball',
  'other',
];

export const EVENT_STATUSES = [
  'upcoming',
  'registration_open',
  'registration_closed',
  'completed',
  'cancelled',
];

export const PAYMENT_STATUSES = ['pending', 'verified', 'rejected'];

export const REGISTRATION_STATUSES = ['pending', 'approved', 'rejected'];

export const MEDIA_TYPES = ['image', 'video'];

export const ADMIN_ROLES = ['admin'];

export const DB_NAME = process.env.DB_NAME || 'turf_titans';
