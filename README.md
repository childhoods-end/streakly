# Daily Reset

Daily Reset is now a cross-platform MVP for iOS, Android, and Web. It is built with Expo, React Native, and React Native Web from one shared codebase.

Slogan: Build your streak, one day at a time.

## Current Project Direction

The previous SwiftUI-only implementation has been preserved under `legacy-native-ios/` as a native iOS reference. The main app is now the Expo project at the repository root.

## MVP Scope

- Auth entry with email/password, Google OAuth, and phone OTP through Supabase.
- First-run onboarding with original character DIY and habit creation.
- Daily check-ins with one check-in per habit per local natural day.
- Daily check-in poster with a reusable character asset signature.
- Streak, best streak, 7-day completion rate, and 30-day completion rate.
- Habit creation, editing, archiving, and deletion.
- Supabase-backed account data for profiles, habits, check-ins, badges, poster events, and paywall events.
- Local AsyncStorage cache and demo fallback when Supabase is unavailable.
- Rule-based weekly insight. No AI API is called.
- Seeded achievement badge system.
- Achievement detail/unlocked modal.
- Badge sharing and saving:
  - iOS/Android: rendered card capture plus native share/save APIs.
  - Web: Web Share API or clipboard fallback, plus SVG card download.
- Local notifications:
  - iOS/Android: Expo local notifications.
  - Web: graceful fallback status.
- Soft paywall placeholder with mock premium state.
- Settings, reset data, app version, and disclaimer.

## Tech Stack

- Expo 54
- React 19
- React Native 0.81
- React Native Web
- AsyncStorage
- Expo Notifications
- Expo Media Library
- Expo Sharing
- React Native View Shot
- Supabase Auth, Postgres, and Storage/CDN
- No real payment integration

## Supabase Setup

Set these environment variables before running against a real backend:

```bash
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run `supabase/schema.sql` in the Supabase SQL editor. It creates:

- `profiles`
- `avatar_recipes`
- `avatar_assets`
- `poster_events`
- `habits`
- `check_ins`
- `user_badges`
- `paywall_events`
- the public `avatar-assets` Storage bucket
- Row Level Security policies for user-owned data and public reusable avatar assets

Enable Email, Google, and Phone providers in Supabase Auth. Google OAuth needs the deployed web callback URL and the Expo app scheme redirect URL. Phone OTP needs an SMS provider configured in Supabase.

Allowed redirect URL examples:

```text
https://your-domain.vercel.app
https://your-domain.vercel.app/auth/callback
dailyreset://auth/callback
```

If the Supabase env vars are missing, the app runs in local demo auth mode so the UI can still be tested. In demo mode, phone OTP is `123456`.

## Run

Install dependencies:

```bash
npm install
```

Run Web:

```bash
npm run web
```

Build Web:

```bash
npm run build
```

The web build exports a static site to `dist/`.

Run Android:

```bash
npm run android
```

Run iOS:

```bash
npm run ios
```

For iOS builds you need macOS and Xcode. Android requires Android Studio or a connected Android device. Web runs from this Windows workspace.

## Verified

The Web bundle was verified with:

```bash
npx expo export --platform web
```

The exported static site was served locally and returned HTTP 200 from `http://localhost:8081`.

## Deploy Web to Vercel

This project is ready to deploy as a static Expo Web app on Vercel.

Recommended Vercel settings:

- Framework Preset: Other
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

The repository includes `vercel.json` with the same build/output settings and an SPA fallback rewrite to `index.html`. The fallback is important for auth callback paths such as `/auth/callback`.

Add these Environment Variables in Vercel if you want to use the real Supabase backend:

```bash
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

In Supabase Auth, add the deployed Vercel URL and callback URL to the allowed redirect URLs, for example:

```text
https://your-domain.vercel.app
https://your-domain.vercel.app/auth/callback
```

## App Structure

- `src/App.js`: main app shell, tabs, screens, modals, and interaction flow.
- `src/data/categories.js`: habit categories and units.
- `src/data/avatarParts.js`: original avatar body, skin, hair, accessory, and outfit options.
- `src/data/badges.js`: seeded badge definitions and badge level colors.
- `src/components/AvatarFigure.js`: reusable SVG character renderer.
- `src/components/CheckInPoster.js`: daily poster renderer.
- `src/services/authService.js`: Supabase email, Google, phone OTP, and local demo auth.
- `src/services/profileService.js`: profile and avatar recipe persistence.
- `src/services/avatarAssetService.js`: stable avatar asset signature and Storage/CDN upsert.
- `src/services/posterService.js`: poster event creation.
- `src/services/storage.js`: Supabase persistence with AsyncStorage cache/fallback.
- `src/services/streak.js`: streak and completion-rate logic.
- `src/services/badgeEngine.js`: badge progress and unlock evaluation.
- `src/services/notifications.js`: cross-platform notification service.
- `src/services/share.js`: badge share/save service.
- `assets/`: Expo app icons.
- `legacy-native-ios/`: preserved SwiftUI iOS prototype.

## Data Model

The cross-platform MVP stores these user-owned entities in Supabase, with a local cache for faster startup and offline fallback:

- `Habit`: title, theme category, target value, unit, reminder settings, archive state.
- `CheckIn`: habit id, date, value, note, creation date.
- `UserBadge`: badge code, habit id, unlocked date, share count.
- `Profile`: account identity, onboarding state, linked avatar recipe.
- `AvatarRecipe`: original base body plus skin tone, hair style, hair color, and accessory.
- `AvatarAsset`: stable reusable signature and Storage/CDN location for rendered character assets.
- `PosterEvent`: check-in poster metadata, theme, streak days, and avatar asset signature.
- `PaywallEvent`: soft paywall event type and creation date.

Badge definitions are static seed data in `src/data/badges.js`.

## Streak Rules

- A habit can be checked in once per local natural day.
- If today is checked in, the current streak counts backward from today.
- If today is not checked in but yesterday is checked in, the current streak counts backward from yesterday.
- If a day is missed, the current streak restarts.
- Best streak is the longest historical consecutive run.

## Not Included

- HealthKit.
- Apple Watch.
- WidgetKit.
- Real StoreKit / Google Play Billing.
- Real AI API calls.
- Community features.

## Future Directions

- Real StoreKit 2 and Google Play Billing subscriptions.
- WidgetKit and Android widgets.
- Conflict-aware offline sync.
- Apple Watch and Wear OS quick check-in.
- HealthKit and Google Fit integrations.
- AI weekly reports.
- CSV export.
- Theme and app icon customization.
- Custom badges and seasonal badges.
