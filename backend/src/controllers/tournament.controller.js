import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import Registration from '../models/registration.model.js';
import TournamentGroup from '../models/group.model.js';
import Fixture from '../models/fixture.model.js';
import MatchSession from '../models/matchSession.model.js';
import Score from '../models/score.model.js';
import Event from '../models/event.model.js';
import { calculateTournamentPointsTable } from '../services/pointsTable.service.js';
import { calculateTournamentLeaderboard } from '../services/leaderboard.service.js';
import mongoose from 'mongoose';

// Helper to resolve tournament event and build eventQuery for registrations
const resolveTournamentEventQuery = async (tournamentId) => {
  let event = null;
  if (mongoose.Types.ObjectId.isValid(tournamentId)) {
    event = await Event.findById(tournamentId);
  }
  if (!event) {
    event = await Event.findOne({
      $or: [
        { slug: tournamentId },
        { title: new RegExp(`^${tournamentId}$`, 'i') },
      ],
    });
  }

  if (event) {
    const isDefault = event.slug === 'turf-titans-2025' || tournamentId === 'turf-titans-2025';
    if (isDefault) {
      return { $or: [{ eventId: event._id }, { eventId: null }] };
    }
    return { eventId: event._id };
  }

  if (mongoose.Types.ObjectId.isValid(tournamentId)) {
    return { eventId: tournamentId };
  }

  if (tournamentId === 'turf-titans-2025') {
    return { $or: [{ eventId: null }] };
  }

  // Unknown tournament without event document
  return { eventId: new mongoose.Types.ObjectId() };
};

// 1. Fetch all approved registered teams for a tournament
export const getRegisteredTeams = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;

  const eventQuery = await resolveTournamentEventQuery(tournamentId);

  const query = {
    registrationStatus: { $in: ['approved', 'APPROVED'] },
    ...eventQuery,
  };

  const registrations = await Registration.find(query)
    .sort({ createdAt: 1 })
    .select('registrationId teamName teamLogo captainName captainEmail captainPhone whatsappNumber sport players paymentStatus registrationStatus createdAt eventId');

  // Distinct by teamName to ensure clean list
  const uniqueTeamsMap = new Map();
  registrations.forEach((reg) => {
    if (reg.teamName && !uniqueTeamsMap.has(reg.teamName.trim().toLowerCase())) {
      uniqueTeamsMap.set(reg.teamName.trim().toLowerCase(), {
        _id: reg._id,
        registrationId: reg.registrationId,
        teamName: reg.teamName.trim(),
        teamLogo: reg.teamLogo,
        captainName: reg.captainName,
        captainEmail: reg.captainEmail,
        captainPhone: reg.captainPhone,
        whatsappNumber: reg.whatsappNumber,
        sport: reg.sport,
        players: reg.players || [],
        playerCount: reg.players?.length || 0,
        registrationStatus: reg.registrationStatus,
        paymentStatus: reg.paymentStatus,
        createdAt: reg.createdAt,
        eventId: reg.eventId,
      });
    }
  });

  const teams = Array.from(uniqueTeamsMap.values());

  res.status(200).json(
    new ApiResponse(200, teams, 'Approved registered teams fetched successfully')
  );
});

// 2. Fetch all groups and assigned teams
export const getTournamentGroups = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;

  const groups = await TournamentGroup.find({ tournamentId }).sort({ groupName: 1 });

  res.status(200).json(
    new ApiResponse(200, groups, 'Tournament groups fetched successfully')
  );
});

// 2b. Create a new Tournament Group (Admin only)
export const createTournamentGroup = asyncHandler(async (req, res) => {
  const tournamentId = req.params.tournamentId || req.body.tournamentId || 'turf-titans-2025';
  const { groupName } = req.body;

  if (!groupName || !groupName.trim()) {
    throw new ApiError(400, 'Group name is required');
  }

  const cleanedGroup = groupName.trim().toUpperCase();

  const existingGroup = await TournamentGroup.findOne({
    tournamentId,
    groupName: cleanedGroup,
  });

  if (existingGroup) {
    throw new ApiError(400, `Group "${cleanedGroup}" already exists in this tournament.`);
  }

  const newGroup = await TournamentGroup.create({
    tournamentId,
    groupName: cleanedGroup,
    teams: [],
    updatedBy: req.user?._id || req.admin?._id,
  });

  res.status(201).json(
    new ApiResponse(201, newGroup, `Group ${cleanedGroup} created successfully`)
  );
});

// 2c. Delete a Tournament Group (Admin only)
export const deleteTournamentGroup = asyncHandler(async (req, res) => {
  const tournamentId = req.params.tournamentId || req.body.tournamentId || 'turf-titans-2025';
  const groupName = req.params.groupName || req.body.groupName;

  if (!groupName || !groupName.trim()) {
    throw new ApiError(400, 'Group name is required');
  }

  const cleanedGroup = decodeURIComponent(groupName.trim()).toUpperCase();

  const group = await TournamentGroup.findOne({
    tournamentId,
    groupName: cleanedGroup,
  });

  if (!group) {
    throw new ApiError(404, `Group ${cleanedGroup} not found in this tournament.`);
  }

  if (group.teams && group.teams.length > 0) {
    throw new ApiError(
      400,
      `Cannot delete ${cleanedGroup} because it still contains ${group.teams.length} assigned team(s). Please unassign/remove all teams first.`
    );
  }

  const existingFixtures = await Fixture.find({
    tournamentId,
    groupName: cleanedGroup,
  });

  if (existingFixtures.length > 0) {
    throw new ApiError(
      400,
      `Cannot delete ${cleanedGroup} because it has ${existingFixtures.length} scheduled or completed fixture(s). Delete the fixtures first.`
    );
  }

  await TournamentGroup.findByIdAndDelete(group._id);

  res.status(200).json(
    new ApiResponse(200, null, `Group ${cleanedGroup} deleted successfully`)
  );
});

// 3. Save / Update group team assignment (Admin only)
export const saveTournamentGroup = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;
  const { groupName, teams } = req.body;

  if (!groupName || !groupName.trim()) {
    throw new ApiError(400, 'Group name is required');
  }

  if (!Array.isArray(teams)) {
    throw new ApiError(400, 'Teams must be an array of team names');
  }

  const cleanedGroupName = groupName.trim().toUpperCase();
  const cleanedTeams = teams.map((t) => t.trim()).filter(Boolean);

  // Validate duplicate team names in the same payload
  const duplicateInPayload = new Set();
  for (const t of cleanedTeams) {
    const lower = t.toLowerCase();
    if (duplicateInPayload.has(lower)) {
      throw new ApiError(400, `Duplicate team "${t}" selected in the same group.`);
    }
    duplicateInPayload.add(lower);
  }

  // Validate that all selected teams are APPROVED registrations for this tournament
  if (cleanedTeams.length > 0) {
    const eventQuery = await resolveTournamentEventQuery(tournamentId);
    const existingRegistrations = await Registration.find({
      teamName: { $in: cleanedTeams },
      registrationStatus: { $in: ['approved', 'APPROVED'] },
      ...eventQuery,
    }).select('teamName');

    const registeredTeamNamesLower = new Set(
      existingRegistrations.map((r) => r.teamName.trim().toLowerCase())
    );

    for (const t of cleanedTeams) {
      if (!registeredTeamNamesLower.has(t.toLowerCase())) {
        throw new ApiError(
          400,
          `Team "${t}" is either not registered or not yet approved for this tournament. Only approved teams can be assigned to groups.`
        );
      }
    }
  }

  // Check other groups in the same tournament to ensure no team is assigned to multiple groups
  const otherGroups = await TournamentGroup.find({
    tournamentId,
    groupName: { $ne: cleanedGroupName },
  });

  const assignedToOtherGroups = new Map();
  otherGroups.forEach((g) => {
    g.teams.forEach((t) => {
      assignedToOtherGroups.set(t.trim().toLowerCase(), g.groupName);
    });
  });

  for (const t of cleanedTeams) {
    const conflictingGroup = assignedToOtherGroups.get(t.toLowerCase());
    if (conflictingGroup) {
      throw new ApiError(
        400,
        `Team "${t}" is already assigned to ${conflictingGroup}. A team cannot belong to multiple groups.`
      );
    }
  }

  // Save/update the group
  const group = await TournamentGroup.findOneAndUpdate(
    { tournamentId, groupName: cleanedGroupName },
    {
      tournamentId,
      groupName: cleanedGroupName,
      teams: cleanedTeams,
      updatedBy: req.user?._id || req.admin?._id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json(
    new ApiResponse(200, group, `Group ${cleanedGroupName} updated successfully`)
  );
});

// 3b. Assign a single team to a group (Admin only)
export const assignTeamToGroup = asyncHandler(async (req, res) => {
  const { tournamentId, groupName } = req.params;
  const { teamName } = req.body;

  if (!groupName || !teamName) {
    throw new ApiError(400, 'Group name and Team name are required');
  }

  const cleanedGroup = groupName.trim().toUpperCase();
  const cleanedTeam = teamName.trim();

  // Validate team is APPROVED for this tournament
  const eventQuery = await resolveTournamentEventQuery(tournamentId);
  const registration = await Registration.findOne({
    teamName: new RegExp(`^${cleanedTeam}$`, 'i'),
    registrationStatus: { $in: ['approved', 'APPROVED'] },
    ...eventQuery,
  });

  if (!registration) {
    throw new ApiError(400, `Team "${cleanedTeam}" is not registered or not approved for this tournament.`);
  }

  // Check if team is already assigned to ANY group in this tournament
  const existingGroupWithTeam = await TournamentGroup.findOne({
    tournamentId,
    teams: { $elemMatch: { $regex: new RegExp(`^${cleanedTeam}$`, 'i') } },
  });

  if (existingGroupWithTeam) {
    throw new ApiError(
      400,
      `Team "${cleanedTeam}" is already assigned to ${existingGroupWithTeam.groupName}. A team cannot belong to multiple groups.`
    );
  }

  // Add team to the target group
  const group = await TournamentGroup.findOneAndUpdate(
    { tournamentId, groupName: cleanedGroup },
    {
      $addToSet: { teams: cleanedTeam },
      $setOnInsert: { tournamentId, groupName: cleanedGroup },
      updatedBy: req.user?._id || req.admin?._id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json(
    new ApiResponse(200, group, `Team "${cleanedTeam}" assigned to ${cleanedGroup} successfully`)
  );
});

// 4. Fetch fixtures for tournament
export const getTournamentFixtures = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;
  const { groupName, status, ground } = req.query;

  const query = { tournamentId };
  if (groupName && groupName !== 'ALL') {
    query.groupName = groupName.trim().toUpperCase();
  }
  if (status && status !== 'ALL') {
    query.status = status.trim().toUpperCase();
  }
  if (ground && ground !== 'ALL') {
    query.ground = ground.trim();
  }

  const fixtures = await Fixture.find(query).sort({ date: 1, time: 1, createdAt: 1 }).lean();

  // Attach team logos for consistent display
  const teamNames = new Set();
  fixtures.forEach((f) => {
    if (f.team1) teamNames.add(f.team1.trim().toLowerCase());
    if (f.team2) teamNames.add(f.team2.trim().toLowerCase());
  });

  if (teamNames.size > 0) {
    const regs = await Registration.find({
      $or: Array.from(teamNames).map((t) => ({
        teamName: new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      })),
    }).select('teamName teamLogo');

    const logoMap = new Map();
    regs.forEach((r) => {
      if (r.teamName && r.teamLogo) {
        logoMap.set(r.teamName.trim().toLowerCase(), r.teamLogo);
      }
    });

    fixtures.forEach((f) => {
      f.team1Logo = logoMap.get(f.team1?.trim().toLowerCase()) || null;
      f.team2Logo = logoMap.get(f.team2?.trim().toLowerCase()) || null;
    });
  }

  res.status(200).json(
    new ApiResponse(200, fixtures, 'Fixtures fetched successfully')
  );
});

// 5. Create a fixture (Admin only)
export const createTournamentFixture = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;
  const {
    groupName,
    team1,
    team2,
    date,
    time,
    ground,
    status,
    matchNumber,
    matchTitle,
    round,
  } = req.body;

  if (!groupName || !groupName.trim()) {
    throw new ApiError(400, 'Group selection is required');
  }

  if (!team1 || !team2) {
    throw new ApiError(400, 'Both Team 1 and Team 2 must be selected');
  }

  const cleanedTeam1 = team1.trim();
  const cleanedTeam2 = team2.trim();
  const cleanedGroup = groupName.trim().toUpperCase();

  if (cleanedTeam1.toLowerCase() === cleanedTeam2.toLowerCase()) {
    throw new ApiError(400, 'Team 1 and Team 2 cannot be the same team');
  }

  if (!date || !time) {
    throw new ApiError(400, 'Match date and time are required');
  }

  // Validate date is within tournament range if tournament event exists in DB
  let event = null;
  if (mongoose.Types.ObjectId.isValid(tournamentId)) {
    event = await Event.findById(tournamentId);
  }
  if (!event) {
    event = await Event.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(tournamentId) ? tournamentId : null },
        { title: new RegExp(`^${tournamentId}$`, 'i') },
      ],
    });
  }

  if (event && event.startDate && event.endDate) {
    const fixtureDateObj = new Date(date.trim());
    const startRange = new Date(event.startDate);
    startRange.setHours(0, 0, 0, 0);
    const endRange = new Date(event.endDate);
    endRange.setHours(23, 59, 59, 999);

    if (isNaN(fixtureDateObj.getTime()) || fixtureDateObj < startRange || fixtureDateObj > endRange) {
      const startStr = startRange.toISOString().slice(0, 10);
      const endStr = endRange.toISOString().slice(0, 10);
      throw new ApiError(
        400,
        `Fixture date must be within the tournament schedule (${startStr} to ${endStr})`
      );
    }
  }

  // Validate that both teams are assigned to the selected group
  const group = await TournamentGroup.findOne({
    tournamentId,
    groupName: cleanedGroup,
  });

  if (!group) {
    throw new ApiError(400, `Group ${cleanedGroup} has no assigned teams yet.`);
  }

  const groupTeamsLower = group.teams.map((t) => t.trim().toLowerCase());
  if (!groupTeamsLower.includes(cleanedTeam1.toLowerCase())) {
    throw new ApiError(400, `Team "${cleanedTeam1}" is not assigned to ${cleanedGroup}`);
  }
  if (!groupTeamsLower.includes(cleanedTeam2.toLowerCase())) {
    throw new ApiError(400, `Team "${cleanedTeam2}" is not assigned to ${cleanedGroup}`);
  }

  const matchId = `match-${tournamentId}-${Date.now().toString().slice(-6)}`;

  const fixture = await Fixture.create({
    tournamentId,
    groupName: cleanedGroup,
    matchNumber: matchNumber || (await Fixture.countDocuments({ tournamentId })) + 1,
    team1: cleanedTeam1,
    team2: cleanedTeam2,
    date: date.trim(),
    time: time.trim(),
    ground: ground ? ground.trim() : 'Pitch 1 - North Court',
    matchTitle: matchTitle ? matchTitle.trim() : 'Group Stage Match',
    round: round ? round.trim() : (matchTitle ? matchTitle.trim() : 'Group Stage'),
    status: status ? status.trim().toUpperCase() : 'UPCOMING',
    matchId,
    createdBy: req.user?._id || req.admin?._id,
  });

  res.status(201).json(
    new ApiResponse(201, fixture, 'Fixture created successfully')
  );
});

// 6. Update a fixture (Admin only)
export const updateTournamentFixture = asyncHandler(async (req, res) => {
  const { fixtureId, tournamentId } = req.params;
  const updateData = { ...req.body };

  if (updateData.status) {
    updateData.status = updateData.status.trim().toUpperCase();
  }

  if (updateData.date && tournamentId) {
    let event = null;
    if (mongoose.Types.ObjectId.isValid(tournamentId)) {
      event = await Event.findById(tournamentId);
    }
    if (!event) {
      event = await Event.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(tournamentId) ? tournamentId : null },
          { title: new RegExp(`^${tournamentId}$`, 'i') },
        ],
      });
    }

    if (event && event.startDate && event.endDate) {
      const fixtureDateObj = new Date(updateData.date.trim());
      const startRange = new Date(event.startDate);
      startRange.setHours(0, 0, 0, 0);
      const endRange = new Date(event.endDate);
      endRange.setHours(23, 59, 59, 999);

      if (isNaN(fixtureDateObj.getTime()) || fixtureDateObj < startRange || fixtureDateObj > endRange) {
        const startStr = startRange.toISOString().slice(0, 10);
        const endStr = endRange.toISOString().slice(0, 10);
        throw new ApiError(
          400,
          `Fixture date must be within the tournament schedule (${startStr} to ${endStr})`
        );
      }
    }
  }

  const fixture = await Fixture.findByIdAndUpdate(
    fixtureId,
    { ...updateData },
    { new: true, runValidators: true }
  );

  if (!fixture) {
    throw new ApiError(404, 'Fixture not found');
  }

  res.status(200).json(
    new ApiResponse(200, fixture, 'Fixture updated successfully')
  );
});

// 7. Remove a team from a group (Admin only)
export const removeTeamFromGroup = asyncHandler(async (req, res) => {
  const tournamentId = req.params.tournamentId || req.body?.tournamentId || 'turf-titans-2025';
  const groupName = req.params.groupName || req.body?.groupName;
  const teamName = req.params.teamName || req.body?.teamName;

  if (!groupName || !teamName) {
    throw new ApiError(400, 'Group name and Team name are required');
  }

  const cleanedGroup = groupName.trim().toUpperCase();
  const cleanedTeam = decodeURIComponent(teamName.trim());

  const group = await TournamentGroup.findOne({
    tournamentId,
    groupName: cleanedGroup,
  });

  if (!group) {
    throw new ApiError(404, `Group ${cleanedGroup} not found`);
  }

  // Check if team has active or completed fixtures in this tournament
  const activeOrCompletedFixtures = await Fixture.find({
    tournamentId,
    groupName: cleanedGroup,
    status: { $in: ['LIVE', 'COMPLETED'] },
    $or: [{ team1: cleanedTeam }, { team2: cleanedTeam }],
  });

  if (activeOrCompletedFixtures.length > 0) {
    throw new ApiError(
      400,
      `Cannot remove team "${cleanedTeam}" because it has active or completed matches in ${cleanedGroup}.`
    );
  }

  // Safely clean up any UPCOMING fixtures involving this team to prevent orphan/broken fixtures
  await Fixture.deleteMany({
    tournamentId,
    groupName: cleanedGroup,
    status: 'UPCOMING',
    $or: [{ team1: cleanedTeam }, { team2: cleanedTeam }],
  });

  // Remove team from group
  group.teams = group.teams.filter(
    (t) => t.trim().toLowerCase() !== cleanedTeam.toLowerCase()
  );
  await group.save();

  res.status(200).json(
    new ApiResponse(200, group, `Team "${cleanedTeam}" removed from ${cleanedGroup} successfully`)
  );
});

// 8. Delete a fixture (Admin only)
export const deleteTournamentFixture = asyncHandler(async (req, res) => {
  const { fixtureId } = req.params;

  const fixture = await Fixture.findById(fixtureId);
  if (!fixture) {
    throw new ApiError(404, 'Fixture not found');
  }

  // Clean up any associated match session and score records to prevent orphan scoring data
  if (fixture.matchId) {
    await MatchSession.deleteMany({ matchId: fixture.matchId });
    await Score.deleteMany({ matchId: fixture.matchId });
  }

  await Fixture.findByIdAndDelete(fixtureId);

  res.status(200).json(
    new ApiResponse(200, null, 'Fixture deleted successfully')
  );
});

// 8. Fetch Points Table for tournament (derived from Groups and Completed Fixtures)
export const getTournamentPointsTable = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;

  const pointsTable = await calculateTournamentPointsTable(tournamentId);

  res.status(200).json(
    new ApiResponse(200, pointsTable, 'Tournament points table fetched successfully')
  );
});

// 9. Fetch Leaderboard & MVP for tournament (derived from Registrations and Match Scoring)
export const getTournamentLeaderboard = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;
  const { category, statistic, team } = req.query;

  const leaderboard = await calculateTournamentLeaderboard(tournamentId, {
    category,
    statistic,
    team,
  });

  res.status(200).json(
    new ApiResponse(200, leaderboard, 'Tournament leaderboard fetched successfully')
  );
});


