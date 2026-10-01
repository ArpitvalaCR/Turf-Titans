import { Router } from 'express';
import {
  getRegisteredTeams,
  getTournamentGroups,
  createTournamentGroup,
  deleteTournamentGroup,
  saveTournamentGroup,
  assignTeamToGroup,
  removeTeamFromGroup,
  getTournamentFixtures,
  createTournamentFixture,
  updateTournamentFixture,
  deleteTournamentFixture,
  getTournamentPointsTable,
  getTournamentLeaderboard,
} from '../controllers/tournament.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Public / Authenticated read routes
router.get('/:tournamentId/registered-teams', getRegisteredTeams);
router.get('/:tournamentId/groups', getTournamentGroups);
router.get('/groups', getTournamentGroups);
router.get('/:tournamentId/fixtures', getTournamentFixtures);
router.get('/fixtures', getTournamentFixtures);
router.get('/:tournamentId/points-table', getTournamentPointsTable);
router.get('/:tournamentId/leaderboard', getTournamentLeaderboard);

// ADMIN-ONLY mutation routes
router.post('/:tournamentId/groups/create', verifyJWT, isAdmin, createTournamentGroup);
router.post('/groups/create', verifyJWT, isAdmin, createTournamentGroup);
router.delete('/:tournamentId/groups/:groupName', verifyJWT, isAdmin, deleteTournamentGroup);
router.delete('/groups/:groupName', verifyJWT, isAdmin, deleteTournamentGroup);
router.post('/:tournamentId/groups/:groupName/delete', verifyJWT, isAdmin, deleteTournamentGroup);
router.post('/groups/:groupName/delete', verifyJWT, isAdmin, deleteTournamentGroup);

router.post('/:tournamentId/groups', verifyJWT, isAdmin, saveTournamentGroup);
router.post('/groups', verifyJWT, isAdmin, saveTournamentGroup);
router.post('/:tournamentId/groups/:groupName/teams', verifyJWT, isAdmin, assignTeamToGroup);
router.post('/groups/:groupName/teams', verifyJWT, isAdmin, assignTeamToGroup);

// Remove team from group routes (DELETE & POST aliases)
router.delete('/:tournamentId/groups/:groupName/teams/:teamName', verifyJWT, isAdmin, removeTeamFromGroup);
router.delete('/groups/:groupName/teams/:teamName', verifyJWT, isAdmin, removeTeamFromGroup);
router.post('/:tournamentId/groups/:groupName/teams/:teamName/remove', verifyJWT, isAdmin, removeTeamFromGroup);
router.post('/:tournamentId/groups/:groupName/remove-team', verifyJWT, isAdmin, removeTeamFromGroup);
router.post('/groups/:groupName/remove-team', verifyJWT, isAdmin, removeTeamFromGroup);

// Fixture mutation routes
router.post('/:tournamentId/fixtures', verifyJWT, isAdmin, createTournamentFixture);
router.post('/fixtures', verifyJWT, isAdmin, createTournamentFixture);
router.patch('/:tournamentId/fixtures/:fixtureId', verifyJWT, isAdmin, updateTournamentFixture);
router.patch('/fixtures/:fixtureId', verifyJWT, isAdmin, updateTournamentFixture);
router.delete('/:tournamentId/fixtures/:fixtureId', verifyJWT, isAdmin, deleteTournamentFixture);
router.delete('/fixtures/:fixtureId', verifyJWT, isAdmin, deleteTournamentFixture);
router.post('/:tournamentId/fixtures/:fixtureId/delete', verifyJWT, isAdmin, deleteTournamentFixture);
router.post('/fixtures/:fixtureId/delete', verifyJWT, isAdmin, deleteTournamentFixture);

export default router;
