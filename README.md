# Treksor

**Build strength. Find clarity. Live with purpose.**

Treksor is a personal-development mobile app that brings daily practices for body, mind and wellbeing into one focused experience. The visual language is deliberately restrained: deep navy, warm gold, readable type and clear actions.

## What is in the app

- **Body:** workouts, nutrition and supporting educational content.
- **Mind:** personal reflections, journaling and motivational thoughts.
- **Spiritual:** meditation content and articles.
- **AI companion:** a chat experience for guidance and reflection.
- **Progress:** activity tracking and habit check-ins.
- **Purpose:** an additional pillar **in development**; not advertised as available yet.

Some features require a subscription. Prices, trials, renewals and eligibility are determined by the App Store or Google Play checkout; do not hard-code promotional terms into marketing assets.

## Tech stack

Expo SDK 53 · React Native · TypeScript · Expo Router · Zustand · RevenueCat.

## Develop

1. Install Node.js 20 or newer and the required iOS/Android development tools.
2. Run `npm ci`.
3. Provide the platform configuration and environment values required by `app.config.js`. Keep credentials out of commits.
4. Run `npx expo start --dev-client` or build a development client using EAS.
5. Validate with `npm run lint` and `npm run typecheck`.

## Release quality

Before filming promotional content or submitting a store build, complete [the release QA checklist](docs/RELEASE_QA.md). Preview releases should be tested on physical iOS and Android devices, including the subscription flow and account deletion.

This repository contains the app's client. The backend and admin dashboard are maintained separately.
