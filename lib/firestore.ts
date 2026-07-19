"use client";

import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ball, Innings, Match, MatchComment, Player, Team, Tournament } from "@/types/cricket";
import { applyBallToInnings, makeBallFromInput, revertBallFromInnings } from "@/lib/scoring";
import { BallInput } from "@/types/schemas";

function normalizeDate(value: unknown): Date | undefined {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return undefined;
}

function withId<T extends object>(id: string, data: Record<string, unknown>): T {
  return {
    id,
    ...data,
    createdAt: normalizeDate(data.createdAt),
    updatedAt: normalizeDate(data.updatedAt),
  } as T;
}

function dbAssert() {
  if (!db) throw new Error("Firebase is not configured");
  return db;
}

export function subscribeTournaments(callback: (items: Tournament[]) => void) {
  const database = dbAssert();
  return onSnapshot(collection(database, "tournaments"), (snap) => {
    callback(snap.docs.map((d) => withId<Tournament>(d.id, d.data())));
  });
}

export function subscribeTeams(tournamentId: string, callback: (items: Team[]) => void) {
  const database = dbAssert();
  const teamsRef = collection(database, "tournaments", tournamentId, "teams");
  return onSnapshot(teamsRef, (snap) => callback(snap.docs.map((d) => withId<Team>(d.id, d.data()))));
}

export function subscribePlayers(tournamentId: string, callback: (items: Player[]) => void) {
  const database = dbAssert();
  const playersRef = collection(database, "tournaments", tournamentId, "players");
  return onSnapshot(playersRef, (snap) => callback(snap.docs.map((d) => withId<Player>(d.id, d.data()))));
}

export function subscribeMatches(tournamentId: string, callback: (items: Match[]) => void) {
  const database = dbAssert();
  const matchesRef = query(
    collection(database, "tournaments", tournamentId, "matches"),
    orderBy("scheduledAt", "asc"),
  );
  return onSnapshot(matchesRef, (snap) => callback(snap.docs.map((d) => withId<Match>(d.id, d.data()))));
}

export function subscribeMatch(
  tournamentId: string,
  matchId: string,
  callback: (item: Match | null) => void,
) {
  const database = dbAssert();
  return onSnapshot(doc(database, "tournaments", tournamentId, "matches", matchId), (snap) => {
    callback(snap.exists() ? withId<Match>(snap.id, snap.data()) : null);
  });
}

export function subscribeInnings(
  tournamentId: string,
  matchId: string,
  inningsNumber: 1 | 2,
  callback: (inning: Innings | null) => void,
) {
  const database = dbAssert();
  return onSnapshot(
    doc(database, "tournaments", tournamentId, "matches", matchId, "innings", String(inningsNumber)),
    (snap) => callback(snap.exists() ? withId<Innings>(snap.id, snap.data()) : null),
  );
}

export function subscribeLastBalls(
  tournamentId: string,
  matchId: string,
  inningsNumber: 1 | 2,
  count: number,
  callback: (balls: Ball[]) => void,
) {
  const database = dbAssert();
  const ballsRef = query(
    collection(database, "tournaments", tournamentId, "matches", matchId, "innings", String(inningsNumber), "balls"),
    orderBy("sequence", "desc"),
    limit(count),
  );

  return onSnapshot(ballsRef, (snap) => {
    callback(snap.docs.map((d) => withId<Ball>(d.id, d.data())).reverse());
  });
}

export function subscribeComments(
  tournamentId: string,
  matchId: string,
  pageSize: number,
  callback: (comments: MatchComment[], cursor: unknown) => void,
) {
  const database = dbAssert();
  const commentsRef = query(
    collection(database, "tournaments", tournamentId, "matches", matchId, "comments"),
    orderBy("createdAt", "desc"),
    limit(pageSize),
  );

  return onSnapshot(commentsRef, (snap) => {
    const items = snap.docs.map((d) => withId<MatchComment>(d.id, d.data()));
    callback(items, snap.docs.at(-1));
  });
}

export async function loadOlderComments(
  tournamentId: string,
  matchId: string,
  cursor: unknown,
  pageSize: number,
): Promise<{ comments: MatchComment[]; cursor: unknown }> {
  const database = dbAssert();
  if (!cursor) return { comments: [], cursor: null };
  const commentsRef = query(
    collection(database, "tournaments", tournamentId, "matches", matchId, "comments"),
    orderBy("createdAt", "desc"),
    startAfter(cursor as never),
    limit(pageSize),
  );
  const snap = await getDocs(commentsRef);
  return {
    comments: snap.docs.map((d) => withId<MatchComment>(d.id, d.data())),
    cursor: snap.docs.at(-1) ?? null,
  };
}

export async function upsertTournament(tournamentId: string | null, data: Omit<Tournament, "id">) {
  const database = dbAssert();
  const payload = { ...data, updatedAt: serverTimestamp(), createdAt: serverTimestamp() };
  if (tournamentId) {
    await updateDoc(doc(database, "tournaments", tournamentId), { ...data, updatedAt: serverTimestamp() });
    return;
  }
  await addDoc(collection(database, "tournaments"), payload);
}

export async function upsertTeam(tournamentId: string, teamId: string | null, data: Omit<Team, "id">) {
  const database = dbAssert();
  if (teamId) {
    await updateDoc(doc(database, "tournaments", tournamentId, "teams", teamId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return;
  }
  await addDoc(collection(database, "tournaments", tournamentId, "teams"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function upsertPlayer(tournamentId: string, playerId: string | null, data: Omit<Player, "id">) {
  const database = dbAssert();
  if (playerId) {
    await updateDoc(doc(database, "tournaments", tournamentId, "players", playerId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return;
  }
  await addDoc(collection(database, "tournaments", tournamentId, "players"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function upsertMatch(tournamentId: string, matchId: string | null, data: Omit<Match, "id">) {
  const database = dbAssert();
  const payload = { ...data, updatedAt: serverTimestamp(), createdAt: serverTimestamp() };
  if (matchId) {
    await updateDoc(doc(database, "tournaments", tournamentId, "matches", matchId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return;
  }
  const matchRef = await addDoc(collection(database, "tournaments", tournamentId, "matches"), payload);
  await setDoc(doc(database, "tournaments", tournamentId, "matches", matchRef.id, "innings", "1"), {
    id: "1",
    battingTeamId: data.teamAId,
    bowlingTeamId: data.teamBId,
    totalRuns: 0,
    totalWickets: 0,
    legalBalls: 0,
    extras: 0,
    isCompleted: false,
    battingStats: {},
    bowlingStats: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(database, "tournaments", tournamentId, "matches", matchRef.id, "innings", "2"), {
    id: "2",
    battingTeamId: data.teamBId,
    bowlingTeamId: data.teamAId,
    totalRuns: 0,
    totalWickets: 0,
    legalBalls: 0,
    extras: 0,
    isCompleted: false,
    battingStats: {},
    bowlingStats: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEntity(path: string[]) {
  const database = dbAssert();
  await deleteDoc(doc(database, ...path));
}

export async function setPlayingXI(
  tournamentId: string,
  matchId: string,
  playingXI: Record<string, string[]>,
) {
  const database = dbAssert();
  await updateDoc(doc(database, "tournaments", tournamentId, "matches", matchId), {
    playingXI,
    updatedAt: serverTimestamp(),
  });
}

export async function setMatchStatus(tournamentId: string, matchId: string, status: Match["status"]) {
  const database = dbAssert();
  await updateDoc(doc(database, "tournaments", tournamentId, "matches", matchId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function postComment(
  tournamentId: string,
  matchId: string,
  userId: string,
  displayName: string,
  text: string,
) {
  const database = dbAssert();
  await addDoc(collection(database, "tournaments", tournamentId, "matches", matchId, "comments"), {
    userId,
    displayName,
    text,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(
    doc(database, "users", userId),
    {
      uid: userId,
      displayName,
      lastCommentAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function deleteComment(tournamentId: string, matchId: string, commentId: string) {
  const database = dbAssert();
  await deleteDoc(doc(database, "tournaments", tournamentId, "matches", matchId, "comments", commentId));
}

export async function isAdmin(uid: string): Promise<boolean> {
  const database = dbAssert();
  const snap = await getDoc(doc(database, "admins", uid));
  return snap.exists();
}

export async function recordBall(
  tournamentId: string,
  matchId: string,
  input: BallInput,
): Promise<void> {
  const database = dbAssert();
  const inningsRef = doc(
    database,
    "tournaments",
    tournamentId,
    "matches",
    matchId,
    "innings",
    String(input.inningsNumber),
  );

  const ballsCol = collection(
    database,
    "tournaments",
    tournamentId,
    "matches",
    matchId,
    "innings",
    String(input.inningsNumber),
    "balls",
  );

  await runTransaction(database, async (tx) => {
    const inningsSnap = await tx.get(inningsRef);
    if (!inningsSnap.exists()) throw new Error("Innings not found");
    const inning = withId<Innings>(inningsSnap.id, inningsSnap.data());

    const lastBallQuery = query(ballsCol, orderBy("sequence", "desc"), limit(1));
    const lastBallSnap = await getDocs(lastBallQuery);
    const lastSequence = lastBallSnap.docs[0]?.data().sequence ?? 0;

    const newBall = makeBallFromInput(input, lastSequence + 1, inning.legalBalls);
    const nextInning = applyBallToInnings(inning, newBall);

    const ballDoc = doc(ballsCol);
    tx.set(ballDoc, {
      ...newBall,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    tx.update(inningsRef, {
      ...nextInning,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function undoLastBall(
  tournamentId: string,
  matchId: string,
  inningsNumber: 1 | 2,
): Promise<void> {
  const database = dbAssert();
  const inningsRef = doc(
    database,
    "tournaments",
    tournamentId,
    "matches",
    matchId,
    "innings",
    String(inningsNumber),
  );
  const ballsCol = collection(
    database,
    "tournaments",
    tournamentId,
    "matches",
    matchId,
    "innings",
    String(inningsNumber),
    "balls",
  );
  const lastBallQuery = query(ballsCol, orderBy("sequence", "desc"), limit(1));

  await runTransaction(database, async (tx) => {
    const inningsSnap = await tx.get(inningsRef);
    if (!inningsSnap.exists()) throw new Error("Innings not found");
    const inning = withId<Innings>(inningsSnap.id, inningsSnap.data());

    const lastBallSnap = await getDocs(lastBallQuery);
    const lastBallDoc = lastBallSnap.docs[0];
    if (!lastBallDoc) throw new Error("No ball to undo");

    const lastBall = withId<Ball>(lastBallDoc.id, lastBallDoc.data());
    const next = revertBallFromInnings(inning, lastBall);

    tx.delete(doc(ballsCol, lastBall.id));
    tx.update(inningsRef, {
      ...next,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function getPlayersByIds(tournamentId: string, ids: string[]): Promise<Player[]> {
  const database = dbAssert();
  if (!ids.length) return [];
  const chunks = ids.reduce<string[][]>((acc, id, idx) => {
    const slot = Math.floor(idx / 10);
    acc[slot] = acc[slot] ?? [];
    acc[slot].push(id);
    return acc;
  }, []);

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const q = query(
        collection(database, "tournaments", tournamentId, "players"),
        where(documentId(), "in", chunk),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => withId<Player>(d.id, d.data()));
    }),
  );

  return results.flat();
}
