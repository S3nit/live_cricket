import { Ball, BowlingStats, ExtraType, Innings } from "@/types/cricket";
import { BallInput } from "@/types/schemas";

export interface ParsedOver {
  overs: number;
  balls: number;
}

export function legalBallsToOvers(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

export function oversToLegalBalls(overs: string): number {
  const [o, b] = overs.split(".").map((v) => Number(v));
  if (!Number.isFinite(o) || !Number.isFinite(b) || b < 0 || b > 5) {
    return 0;
  }
  return o * 6 + b;
}

export function runRate(totalRuns: number, legalBalls: number): number {
  if (!legalBalls) return 0;
  return Number(((totalRuns * 6) / legalBalls).toFixed(2));
}

export function requiredRunRate(targetRuns: number, currentRuns: number, ballsRemaining: number): number {
  if (ballsRemaining <= 0) return 0;
  const needed = Math.max(targetRuns - currentRuns, 0);
  return Number(((needed * 6) / ballsRemaining).toFixed(2));
}

export function makeBallFromInput(
  input: BallInput,
  sequence: number,
  currentLegalBalls: number,
): Omit<Ball, "id" | "createdAt" | "updatedAt"> {
  const extraFlags: Record<ExtraType, Pick<Ball, "isWide" | "isNoBall" | "isBye" | "isLegBye">> = {
    none: { isWide: false, isNoBall: false, isBye: false, isLegBye: false },
    wide: { isWide: true, isNoBall: false, isBye: false, isLegBye: false },
    noball: { isWide: false, isNoBall: true, isBye: false, isLegBye: false },
    bye: { isWide: false, isNoBall: false, isBye: true, isLegBye: false },
    legbye: { isWide: false, isNoBall: false, isBye: false, isLegBye: true },
  };

  const legal = input.extraType !== "wide" && input.extraType !== "noball";
  const legalBallCount = currentLegalBalls + (legal ? 1 : 0);

  return {
    inningsNumber: input.inningsNumber,
    sequence,
    overNumber: Math.floor(currentLegalBalls / 6),
    ballInOver: legalBallCount % 6 || (legal ? 6 : currentLegalBalls % 6),
    bowlerId: input.bowlerId,
    strikerId: input.strikerId,
    nonStrikerId: input.nonStrikerId,
    runs: input.runs,
    ...extraFlags[input.extraType],
    isWicket: input.isWicket,
    dismissalType: input.dismissalType,
    dismissedPlayerId: input.dismissedPlayerId,
    commentaryText: input.commentaryText,
    fielderId: undefined,
  };
}

function ensureBatter(inning: Innings, playerId: string): Innings["battingStats"][string] {
  return (
    inning.battingStats[playerId] ?? {
      playerId,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      out: false,
    }
  );
}

function ensureBowler(inning: Innings, playerId: string): BowlingStats {
  return (
    inning.bowlingStats[playerId] ?? {
      playerId,
      balls: 0,
      maidens: 0,
      runs: 0,
      wickets: 0,
    }
  );
}

export function isLegalDelivery(ball: Pick<Ball, "isWide" | "isNoBall">): boolean {
  return !ball.isWide && !ball.isNoBall;
}

export function ballDisplay(ball: Pick<Ball, "runs" | "isWide" | "isNoBall" | "isWicket">): string {
  if (ball.isWicket) return "W";
  if (ball.isWide) return `${ball.runs}wd`;
  if (ball.isNoBall) return `${ball.runs}nb`;
  return `${ball.runs}`;
}

export function applyBallToInnings(inning: Innings, ball: Pick<
  Ball,
  | "strikerId"
  | "bowlerId"
  | "runs"
  | "isWide"
  | "isNoBall"
  | "isBye"
  | "isLegBye"
  | "isWicket"
  | "dismissedPlayerId"
>): Innings {
  const next: Innings = {
    ...inning,
    battingStats: { ...inning.battingStats },
    bowlingStats: { ...inning.bowlingStats },
  };

  const batter = ensureBatter(next, ball.strikerId);
  const bowler = ensureBowler(next, ball.bowlerId);

  const extraBase = ball.isWide || ball.isNoBall ? 1 : 0;
  const extraRuns = ball.isBye || ball.isLegBye ? ball.runs : extraBase;
  const batsmanRuns = ball.isBye || ball.isLegBye ? 0 : ball.runs;
  const conceded = ball.runs + extraBase;

  next.totalRuns += conceded;
  next.extras += extraRuns;

  if (isLegalDelivery(ball)) {
    next.legalBalls += 1;
    batter.balls += 1;
    bowler.balls += 1;
  }

  batter.runs += batsmanRuns;
  if (batsmanRuns === 4) batter.fours += 1;
  if (batsmanRuns === 6) batter.sixes += 1;

  bowler.runs += conceded;

  if (ball.isWicket) {
    next.totalWickets += 1;
    if (ball.dismissedPlayerId) {
      const dismissed = ensureBatter(next, ball.dismissedPlayerId);
      dismissed.out = true;
    }
    bowler.wickets += 1;
  }

  next.battingStats[ball.strikerId] = batter;
  next.bowlingStats[ball.bowlerId] = bowler;

  return next;
}

export function revertBallFromInnings(inning: Innings, ball: Pick<
  Ball,
  | "strikerId"
  | "bowlerId"
  | "runs"
  | "isWide"
  | "isNoBall"
  | "isBye"
  | "isLegBye"
  | "isWicket"
  | "dismissedPlayerId"
>): Innings {
  const next: Innings = {
    ...inning,
    battingStats: { ...inning.battingStats },
    bowlingStats: { ...inning.bowlingStats },
  };

  const batter = ensureBatter(next, ball.strikerId);
  const bowler = ensureBowler(next, ball.bowlerId);

  const extraBase = ball.isWide || ball.isNoBall ? 1 : 0;
  const extraRuns = ball.isBye || ball.isLegBye ? ball.runs : extraBase;
  const batsmanRuns = ball.isBye || ball.isLegBye ? 0 : ball.runs;
  const conceded = ball.runs + extraBase;

  next.totalRuns = Math.max(0, next.totalRuns - conceded);
  next.extras = Math.max(0, next.extras - extraRuns);

  if (isLegalDelivery(ball)) {
    next.legalBalls = Math.max(0, next.legalBalls - 1);
    batter.balls = Math.max(0, batter.balls - 1);
    bowler.balls = Math.max(0, bowler.balls - 1);
  }

  batter.runs = Math.max(0, batter.runs - batsmanRuns);
  if (batsmanRuns === 4) batter.fours = Math.max(0, batter.fours - 1);
  if (batsmanRuns === 6) batter.sixes = Math.max(0, batter.sixes - 1);

  bowler.runs = Math.max(0, bowler.runs - conceded);

  if (ball.isWicket) {
    next.totalWickets = Math.max(0, next.totalWickets - 1);
    if (ball.dismissedPlayerId) {
      const dismissed = ensureBatter(next, ball.dismissedPlayerId);
      dismissed.out = false;
      next.battingStats[ball.dismissedPlayerId] = dismissed;
    }
    bowler.wickets = Math.max(0, bowler.wickets - 1);
  }

  next.battingStats[ball.strikerId] = batter;
  next.bowlingStats[ball.bowlerId] = bowler;

  return next;
}
