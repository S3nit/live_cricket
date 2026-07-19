# Live Cricket Tournament

A polished Next.js app for tracking a live cricket tournament with a public viewer dashboard, match scorecards, commentary, and bracket views.

## Features

- Tournament overview with live, upcoming, and completed matches
- Match detail view with score header, over ticker, batting and bowling cards
- Live comments and bracket preview
- Firebase-backed data model ready for real-time updates

## Getting started

1. Install dependencies
   ```bash
   npm install
   ```
2. Set up Firebase environment variables for the app
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   NEXT_PUBLIC_DEFAULT_TOURNAMENT_ID=
   ```
3. Run the development server
   ```bash
   npm run dev
   ```

Open http://localhost:3000 to view the app.
