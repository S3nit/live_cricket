import { z } from "zod";

export const tournamentSchema = z.object({
  name: z.string().min(3).max(100),
  format: z.enum(["knockout", "league", "league+knockout"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  status: z.enum(["upcoming", "live", "completed"]),
});

export const teamSchema = z.object({
  name: z.string().min(2).max(80),
  shortName: z.string().min(2).max(5),
  logoUrl: z.string().url().optional().or(z.literal("")),
  groupName: z.string().max(30).optional(),
  colorHex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional().or(z.literal("")),
});

export const playerSchema = z.object({
  name: z.string().min(2).max(80),
  teamId: z.string().min(1),
  role: z.enum(["batter", "bowler", "allrounder", "wicketkeeper"]),
  battingStyle: z.string().max(50).optional(),
  bowlingStyle: z.string().max(50).optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

export const matchSchema = z.object({
  round: z.string().min(1),
  bracketPosition: z.number().int().min(0),
  teamAId: z.string().min(1),
  teamBId: z.string().min(1),
  venue: z.string().min(2),
  scheduledAt: z.string().min(1),
  status: z.enum(["scheduled", "live", "innings_break", "completed", "abandoned"]),
  currentInnings: z.union([z.literal(1), z.literal(2)]),
});

export const ballInputSchema = z.object({
  inningsNumber: z.union([z.literal(1), z.literal(2)]),
  bowlerId: z.string().min(1),
  strikerId: z.string().min(1),
  nonStrikerId: z.string().min(1),
  runs: z.number().int().min(0).max(7),
  extraType: z.enum(["none", "wide", "noball", "bye", "legbye"]),
  isWicket: z.boolean(),
  dismissalType: z.string().max(80).optional(),
  dismissedPlayerId: z.string().optional(),
  commentaryText: z.string().max(300),
});

export const commentSchema = z.object({
  text: z.string().trim().min(1).max(500),
});

export type BallInput = z.infer<typeof ballInputSchema>;
