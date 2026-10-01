import Event from '../models/event.model.js';
import Registration from '../models/registration.model.js';

export const getDashboardStats = async () => {
  const [
    totalEvents,
    upcomingEvents,
    totalRegistrations,
    pendingRegistrations,
    approvedRegistrations,
    pendingPayments,
    verifiedPayments,
    rejectedPayments,
    registrationsByEvent,
    registrationsBySport,
  ] = await Promise.all([
    Event.countDocuments(),
    Event.countDocuments({
      status: { $in: ['upcoming', 'registration_open'] },
    }),
    Registration.countDocuments(),
    Registration.countDocuments({ registrationStatus: 'pending' }),
    Registration.countDocuments({ registrationStatus: 'approved' }),
    Registration.countDocuments({ paymentStatus: 'pending' }),
    Registration.countDocuments({ paymentStatus: 'verified' }),
    Registration.countDocuments({ paymentStatus: 'rejected' }),
    Registration.aggregate([
      { $match: { eventId: { $ne: null } } },
      {
        $group: {
          _id: '$eventId',
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$registrationStatus', 'approved'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'event',
        },
      },
      { $unwind: { path: '$event', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          eventId: '$_id',
          eventTitle: '$event.title',
          sport: '$event.sport',
          count: 1,
          approved: 1,
        },
      },
    ]),
    Registration.aggregate([
      { $match: { sport: { $ne: '' } } },
      {
        $group: {
          _id: '$sport',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    totalEvents,
    upcomingEvents,
    totalRegistrations,
    pendingRegistrations,
    approvedRegistrations,
    pendingPayments,
    verifiedPayments,
    rejectedPayments,
    registrationsByEvent,
    registrationsBySport,
  };
};
