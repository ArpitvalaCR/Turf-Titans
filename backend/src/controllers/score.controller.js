import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Score from '../models/score.model.js';

export const getScore = asyncHandler(async (req, res) => {
  const { matchId } = req.params;

  let score = await Score.findOne({ matchId });
  if (!score) {
    score = {
      matchId,
      tournamentId: req.query.tournamentId || 'turf-titans-2025',
      battingTeam: 'Team 1',
      bowlingTeam: 'Team 2',
      runs: 0,
      wickets: 0,
      balls: 0,
      maxOvers: 5.0,
      target: 0,
      telemetry: [],
      striker: { name: 'Striker 1', runs: 0, balls: 0, fours: 0, sixes: 0 },
      nonStriker: { name: 'Striker 2', runs: 0, balls: 0, fours: 0, sixes: 0 },
      bowler: { name: 'Bowler', overs: '0.0', runsConceded: 0, wickets: 0 },
      status: 'live',
    };
  }

  res.status(200).json(new ApiResponse(200, score, 'Score fetched successfully'));
});

export const updateScore = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const updateData = req.body;

  const score = await Score.findOneAndUpdate(
    { matchId },
    {
      ...updateData,
      matchId,
      updatedBy: req.user._id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json(new ApiResponse(200, score, 'Score updated successfully'));
});
