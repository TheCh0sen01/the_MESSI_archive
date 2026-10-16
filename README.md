# Messi Match Archive

A deployable Next.js + TypeScript app for Messi fans. It includes an archive UI, personal watch tracking, Google sign-in, Firebase persistence, a fan-room chat, and role-aware match management for trusted admins.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without Firebase variables, the app runs in preview mode and saves progress locally. To use Google sign-in and shared data, fill in `.env.local` with the Firebase web app settings.

## Firebase setup

1. Create a Firebase project and register a web app.
2. Enable **Authentication → Google** and add the local and deployed domains to authorized domains.
3. Create a Cloud Firestore database.
4. Add the values from the Firebase web app config to `.env.local` using the variable names in `.env.example`.
5. Publish `firestore.rules` to the project.
6. Grant `admin: true` as a Firebase Auth custom claim using a trusted Admin SDK process. The browser cannot set its own role; only accounts with the verified claim see admin tools, and Firestore rules enforce write access.

The trivia gate is currently a client-side fan filter. Before treating chat as restricted access, validate trivia server-side or with a trusted Cloud Function. Firestore rules currently permit any signed-in user to read and write chat messages; add moderation, rate limiting, and a server-validated fan gate before opening the chat to the public.

## Deploy with Vercel

Import the repository in Vercel, keep the project root at the repository root, select the Next.js framework preset, and add the same `NEXT_PUBLIC_FIREBASE_*` variables under **Project Settings → Environment Variables**. Redeploy after setting them. The `build` script is `next build` and Vercel handles the Next.js runtime automatically.

You can also deploy from a terminal with the Vercel CLI after linking a Vercel project: `vercel` for a preview deployment and `vercel --prod` for production.

## Archive data

`lib/footballia-messi-matches.json` contains the match pages indexed in [Footballia's Lionel Messi archive](https://footballia.net/players/lionel-leo-andres-messi). Each row links to that specific match page; match dates, opponents, competitions, and club/international classification come from Footballia's index. Footballia availability is not the same as every senior appearance in Messi's career, and some records do not list a score. Admins can add archive entries after Firebase and an admin custom claim are set up.

The archive starts with photo-led year cards. Choosing a year filters its indexed matches, and match lists use pagination (24 at a time across all years, 18 within a selected year). Each match has a shared comments thread for signed-in fans. Comments are stored in the `matchComments` collection and governed by `firestore.rules`.

For Google sign-in, the six Firebase web app variables in `.env.example` must be populated in Vercel, Google must be enabled under Firebase Authentication → Sign-in method, and `the-messi-archive.vercel.app` must be listed under Authentication → Settings → Authorized domains. A Firestore sync error also requires a Cloud Firestore database and the current `firestore.rules` to be published in Firebase Console → Firestore Database → Rules. After changing Vercel variables, redeploy the project.

Season card photography is illustrative by career era rather than a match-by-match photo archive. The card images are credited in the interface: M. Caimary (Barcelona, 2011; [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/)), H. Zohrevand (Argentina, 2022; [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)), and Fanny Schertzer (Flickr; [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)).

## Stack

- Next.js App Router and React
- TypeScript
- Firebase Authentication and Cloud Firestore
- Vercel deployment
- Responsive custom CSS
