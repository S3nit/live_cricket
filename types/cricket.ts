export type MatchStatus =
  | "scheduled"
  | "live"
  | "innings_break"
  | "completed"
  | "abandoned";

export type TournamentFormat = "knockout" | "league" | "league+knockout";

export interface TimestampFields {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Tournament extends TimestampFields {
  id: string;
  name: string;
  format: TournamentFormat;
  startDate: string;
  endDate: string;
  status: "upcoming" | "live" | "completed";
}

export interface Team extends TimestampFields {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  groupName?: string;
  colorHex?: string;
}

export type PlayerRole = "batter" | "bowler" | "allrounder" | "wicketkeeper";

export interface Player extends TimestampFields {
  id: string;
  name: string;
  teamId: string;
  role: PlayerRole;
  battingStyle?: string;
  bowlingStyle?: string;
  photoUrl?: string;
}

export interface Match extends TimestampFields {
  id: string;
  round: string;
  bracketPosition: number;
  teamAId: string;
  teamBId: string;
  venue: string;
  scheduledAt: string;
  status: MatchStatus;
  tossWinnerId?: string;
  tossDecision?: "bat" | "bowl";
  playingXI: Record<string, string[]>;
  currentInnings: 1 | 2;
  result?: string;
  manOfTheMatchId?: string;
  winnerTeamId?: string;
}

export interface BattingStats {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean;
  dismissal?: string;
}

export interface BowlingStats {
  playerId: string;
  balls: number;
  maidens: number;
  runs: number;
  wickets: number;
}

export interface Innings extends TimestampFields {
  id: "1" | "2";
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  totalWickets: number;
  legalBalls: number;
  extras: number;
  isCompleted: boolean;
  strikerId?: string;
  nonStrikerId?: string;
  currentBowlerId?: string;
  battingStats: Record<string, BattingStats>;
  bowlingStats: Record<string, BowlingStats>;
}

export type ExtraType = "none" | "wide" | "noball" | "bye" | "legbye";

export interface Ball extends TimestampFields {
  id: string;
  inningsNumber: 1 | 2;
  sequence: number;
  overNumber: number;
  ballInOver: number;
  bowlerId: string;
  strikerId: string;
  nonStrikerId: string;
  runs: number;
  isWide: boolean;
  isNoBall: boolean;
  isBye: boolean;
  isLegBye: boolean;
  isWicket: boolean;
  dismissalType?: string;
  dismissedPlayerId?: string;
  fielderId?: string;
  commentaryText: string;
}

export interface MatchComment extends TimestampFields {
  id: string;
  userId: string;
  displayName: string;
  text: string;
}

export interface UserProfile extends TimestampFields {
  uid: string;
  displayName: string;
  photoURL?: string;
  lastCommentAt?: Date;
}

export interface AdminDoc {
  uid: string;
  addedBy: string;
  addedAt?: Date;
}

export interface BracketNode {
  id: string;
  round: string;
  bracketPosition: number;
  teamAName: string;
  teamBName: string;
  winnerName?: string;
  status: MatchStatus;
}
