# Messi — The Match Archive

A responsive Messi fan app for browsing notable matches, organizing them by year → club/international → competition, and tracking a personal watchlist. The fan room has a one-question trivia gate.

## Run it

Serve this folder with any static web server (Firebase Hosting, Netlify, Vercel, or similar). No build step is required. **Explore the archive** enters local preview mode; it stores the demo profile, watched matches, trivia pass, and fan-room messages in that browser's local storage.

## Current prototype scope

- The archive is a curated starter collection, not a complete match-by-match career database. It contains 24 notable matches across 2004–2025.
- Watch links point to Footballia where a known match URL is available. Some entries use the Footballia home page until a specific archive URL is confirmed. Availability and region access can vary.
- Firebase Google sign-in, per-account cloud watch progress, and live chat are wired but remain inactive until configured.
- The user role is the default. Admin status comes from a Firebase Auth custom claim named `admin`; set that claim only with a trusted Admin SDK process. The prototype displays the role but does not yet include a match-management console.
- The trivia gate is currently a client-side fan filter, so it is not secure access control. Add a trusted server-side quiz check before treating the room as restricted to verified fans.

## Deploy as a static preview

Upload this folder to a static host such as Firebase Hosting, Netlify, Vercel, or GitHub Pages for a local-storage prototype. For a connected Firebase release, use the Firebase setup below first. No hosting account is connected from this workspace, so a public deployment needs a host/project to publish to.

## Production connection checklist

1. Create a Firebase project, register a web app, and create a Firestore database.
2. Enable Google in **Authentication → Sign-in method** and add your deployed domain to authorized domains.
3. Copy the Firebase web app config into `firebase-config.js` as the value of `window.MESSI_FIREBASE_CONFIG`.
4. Publish `firestore.rules` from the Firebase console or Firebase CLI. Rules keep each user's progress private and chat limited to signed-in users.
5. Grant `admin: true` as a Firebase Auth custom claim only through a trusted Admin SDK process. Never accept a role supplied by the browser. Admin claim currently labels the profile; match-management UI still needs to be built.
6. Add server-side trivia validation before relying on the quiz as access control.
7. Import a complete, source-verified match dataset and validate every watch URL. The current seed data is intentionally representative, not exhaustive.

The hero photo is credited in the interface: Fanny Schertzer, CC BY 3.0.
