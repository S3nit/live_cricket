# Build Prompt: Real-Time Cricket Tournament Live Score Platform

> Paste this whole document into GitHub Copilot Chat (or save as `.github/copilot-instructions.md` in your repo so Copilot uses it automatically as context for every suggestion).

## 1. Project Summary

Build a **production-quality, high-performance web application** for running a live cricket tournament — similar in spirit to Google's cricket score cards / ESPN Cricinfo — with:

- A **public Viewer side**: live scores, knockout bracket, lineups, player stats, match schedule, and a live comment section.
- A **restricted Admin side**: score entry (ball-by-ball), match/team/player management, tournament bracket management — accessible only via Google Sign-In restricted to approved admin accounts.
- **Real-time updates everywhere** (score, comments, bracket) with no manual refresh, powered by Firestore's real-time listeners.
- **Fast to ship**: use a modern, batteries-included stack so most of this can be scaffolded quickly.

## 2. Tech Stack (use exactly this unless there's a strong reason not to)

- **Framework**: Next.js 14+ (App Router) with TypeScript — enables both static export (for GitHub Pages) or Vercel/Firebase Hosting if you outgrow Pages.
- **Styling**: Tailwind CSS + shadcn/ui components for a clean, professional sports-app look.
- **State/data**: Firebase Firestore (real-time `onSnapshot` listeners), Firebase Authentication (Google provider).
- **Hosting**: GitHub Actions → GitHub Pages for static frontend (Firestore is called client-side via SDK, so no custom backend server is required). Mention Firebase Hosting as an alternative if GitHub Pages' static-export limitations become a problem (e.g., dynamic routes for many matches).
- **Icons/Charts**: lucide-react for icons; recharts for run-rate graphs/worm charts if time permits.
- **Validation**: zod for form and data validation.
- **Testing**: Vitest + React Testing Library for core scoring logic (run tallying, overs, wickets) since that logic must never be wrong.

## 3. Core User Roles

1. **Admin** — signs in with Google; UID must exist in an `admins` Firestore collection (or custom claim) to unlock admin routes. Admins can:
   - Create/edit tournament, teams, players, venues, match schedule.
   - Build and edit the **knockout bracket/tree** (single elimination to start; design data model so double-elimination or league+playoffs can be added later).
   - Enter **ball-by-ball scoring**: runs, extras (wide/no-ball/bye/leg-bye), wickets (with dismissal type and fielder), strike rotation, overs, current bowler/batsmen, powerplay markers, DRS (optional, nice-to-have).
   - Set/edit playing XI and lineups (batting order, bowlers, captain, wicketkeeper) before a match starts.
   - Moderate/delete inappropriate viewer comments.
   - Mark match status: scheduled → live → innings break → completed / abandoned.

2. **Viewer** — can browse anonymously, but must sign in (Google Sign-In, or optionally anonymous + display name) to post in the **live comments** section. Viewers can:
   - See tournament home: schedule, points table (if league stage exists), knockout bracket.
   - Open a match to see live scorecard: current score, run rate, required run rate (2nd innings), overs, batting card, bowling card, fall of wickets, partnership, last-6-balls ticker.
   - See full squads/lineups per team and per-match playing XI.
   - Post/read live comments per match, updating in real time.

## 4. Feature Checklist (aim to match/beat a Google cricket score card)

- [ ] Tournament dashboard (list of matches: live / upcoming / completed)
- [ ] Live match page with auto-updating scorecard (no page refresh)
- [ ] Ball-by-ball commentary feed (auto-generated text from admin's ball entries, e.g. "4 runs — cover drive" style templates admin can pick or type)
- [ ] Current over ticker (last 6 balls, color-coded: 4s green, 6s purple, wickets red, extras yellow)
- [ ] Batting scorecard (runs, balls, 4s, 6s, strike rate, how out)
- [ ] Bowling scorecard (overs, maidens, runs, wickets, economy)
- [ ] Fall of wickets timeline
- [ ] Partnership tracker
- [ ] Run rate / required run rate, and a simple worm/manhattan chart
- [ ] Team squads & per-match playing XI with roles (batter/bowler/all-rounder/WK) and batting/bowling styles
- [ ] Knockout bracket visualization (tree view, mobile-friendly, shows winner progression)
- [ ] Points table for group stage (NRR calculation if league format is included)
- [ ] Live comments section per match (real-time, with basic moderation & rate limiting)
- [ ] Match result & man-of-the-match
- [ ] Admin dashboard: CRUD for tournaments, teams, players, matches, bracket
- [ ] Admin live scoring console (fast, keyboard-friendly, undo-last-ball button — critical for speed and correcting mistakes)
- [ ] Responsive, mobile-first design (most viewers will be on phones)
- [ ] Loading/skeleton states, offline-friendly fallback message
- [ ] Basic SEO (per-match metadata) even though it's an SPA-ish app

## 5. Firestore Data Model (propose this schema; adjust as needed but keep it normalized and query-efficient)

```
/tournaments/{tournamentId}
  name, format (knockout|league|league+knockout), startDate, endDate, status

/tournaments/{tournamentId}/teams/{teamId}
  name, shortName, logoUrl, groupName (optional)

/tournaments/{tournamentId}/players/{playerId}
  name, teamId, role (batter|bowler|allrounder|wicketkeeper), battingStyle, bowlingStyle, photoUrl

/tournaments/{tournamentId}/matches/{matchId}
  round (e.g. "Quarterfinal 1"), bracketPosition, teamAId, teamBId,
  venue, scheduledAt, status (scheduled|live|innings_break|completed|abandoned),
  tossWinnerId, tossDecision, playingXI: { teamAId: [playerIds], teamBId: [playerIds] },
  currentInnings, result, manOfTheMatchId

/tournaments/{tournamentId}/matches/{matchId}/innings/{inningsNumber}
  battingTeamId, bowlingTeamId, totalRuns, totalWickets, overs, extras, isCompleted

/tournaments/{tournamentId}/matches/{matchId}/innings/{inningsNumber}/balls/{ballId}
  overNumber, ballNumber, bowlerId, strikerId, nonStrikerId,
  runs, isWide, isNoBall, isBye, isLegBye, isWicket, dismissalType, dismissedPlayerId, fielderId,
  commentaryText, timestamp

/tournaments/{tournamentId}/matches/{matchId}/comments/{commentId}
  userId, displayName, text, createdAt

/admins/{uid}
  addedBy, addedAt

/users/{uid}
  displayName, photoUrl, role (viewer default)
```

Design notes for Copilot:
- Keep **balls as an append-only subcollection** — never mutate past balls except via an explicit "undo last ball" admin action, so the scorecard can be derived deterministically by aggregating the balls collection (or maintain running aggregates on the innings doc for performance, updated via a transaction on each ball write).
- Use a **Firestore transaction** whenever writing a ball, to atomically update the innings aggregate (runs/wickets/overs) and append the ball doc — this avoids race conditions if the admin double-taps.
- Use `serverTimestamp()` for all timestamps.

## 6. Security Rules (Firestore)

- Tournaments/teams/players/matches/innings/balls: **public read**, **write only if `request.auth.uid` exists in `/admins/{uid}`**.
- Comments: **public read**, **create only if authenticated**, **delete allowed for comment owner or admin**, no update (immutable comments — encourage delete+repost instead, simpler and safer).
- Reject any comment write over a reasonable length (e.g. 500 chars) and enforce basic rate limiting via Cloud Functions or client-side throttling plus rules-based `request.time` checks against a `lastCommentAt` field on the user doc, if time allows.
- Never trust client-provided `displayName`/role for admin checks — always check the `/admins/{uid}` doc server-side via rules, not a client-side flag.

## 7. Real-Time & Performance Requirements

- Use `onSnapshot` listeners scoped as narrowly as possible (e.g., listen to the current innings doc + last N balls, not the whole balls collection) to control read costs and payload size.
- Paginate comments (load latest 50, "load more" on scroll) rather than snapshotting the entire comments collection.
- Memoize derived scorecard calculations (React `useMemo`) so re-renders on each ball update are cheap.
- Use optimistic UI updates on the admin scoring console so entering a ball feels instant, then reconcile with the transaction result.
- Code-split the admin bundle away from the public viewer bundle so viewers download a smaller JS payload.
- Add basic Lighthouse-driven performance passes: image optimization for logos/photos, font subsetting, avoid layout shift on live-updating elements.

## 8. UX/Visual Direction

- Professional sports-broadcast feel: dark-mode-friendly, team-color accenting, bold score typography, clear live/red-dot indicator on live matches.
- Knockout bracket should be a proper visual tree (consider a lightweight custom SVG/CSS bracket component rather than a heavy library), horizontally scrollable on mobile.
- Sticky score header on the match page so score is visible while scrolling through commentary/comments.
- Skeleton loaders, not blank screens, while Firestore listeners attach.

## 9. Suggested Build Order (so you can ship fast, in this sequence)

1. Scaffold Next.js + TypeScript + Tailwind + shadcn/ui; set up Firebase project (Firestore + Auth) and env config.
2. Auth: Google Sign-In flow, `admins` collection check, protected `/admin` routes.
3. Data model + Firestore security rules; seed script for a demo tournament/teams/players.
4. Admin CRUD: tournaments, teams, players, match scheduling, playing XI selection.
5. Admin live scoring console (the highest-value, highest-complexity screen — build and test this thoroughly, including the undo-last-ball transaction).
6. Public match page: live scorecard, batting/bowling cards, last-6-balls ticker, commentary feed — all wired to real-time listeners.
7. Knockout bracket component (data-driven from `round`/`bracketPosition` fields).
8. Live comments section with auth-gated posting.
9. Points table / NRR (if league format included).
10. Polish: responsive pass, loading states, error boundaries, SEO metadata, Lighthouse pass.
11. GitHub Actions workflow: build (`next build && next export` or Next's static export) → deploy to GitHub Pages on push to `main`.

## 10. Explicit Instructions to Copilot

- Write **TypeScript with strict mode on**; define shared types for `Tournament`, `Team`, `Player`, `Match`, `Innings`, `Ball`, `Comment` in a `types/` folder and reuse them everywhere — no `any`.
- Wrap all Firestore writes in `try/catch` with user-visible error toasts (use shadcn/ui `toast`).
- Every real-time listener must be cleaned up in `useEffect` return functions to prevent memory leaks.
- Keep scoring math (overs display like `4.3`, run rate, NRR) in **pure, unit-tested utility functions** separate from UI components.
- Favor small, composable components (`ScoreHeader`, `BattingCard`, `BowlingCard`, `OverTicker`, `BracketTree`, `CommentFeed`) over large monolithic pages.
- Add comments in code explaining any non-obvious cricket-scoring logic (e.g., no-ball also being a free-hit trigger) so it's maintainable even for contributors unfamiliar with cricket rules.

## 11. Nice-to-Haves (only if time remains)

- Push notifications (via web push) for wickets/match end.
- Player stats aggregated across the whole tournament (most runs, most wickets — "Orange Cap"/"Purple Cap" style leaderboards).
- Shareable match link with Open Graph score-card image (generated via `@vercel/og` or similar).
- PWA install support for a native-app feel on mobile.
