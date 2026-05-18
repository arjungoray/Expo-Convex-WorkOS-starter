# Expo Convex WorkOS Starter

Reusable Expo starter with Convex for realtime backend state and WorkOS AuthKit for authentication. The client is an Expo SDK 55 app, Convex owns server functions, HTTP auth routes, JWT validation, and user sync, and WorkOS owns hosted login, identity providers, organizations, and MFA.

## Stack

- Expo SDK 55, Expo Router, React 19, React Native 0.83, and React Compiler.
- Convex for realtime queries, mutations, database schema, HTTP actions, and auth validation.
- WorkOS AuthKit / SSO for hosted authentication and enterprise identity.
- Expo AuthSession + WebBrowser for native browser sign-in and deep-link callback handling.
- Expo SecureStore for WorkOS token storage on device.
- EAS Build and EAS environment variables for development, preview, and production builds.
- Bun for local dependency installs and scripts.

## Architecture

```text
Expo app
  -> opens WorkOS AuthKit in the system browser
  -> receives a deep-link authorization code
  -> sends the code and PKCE verifier to a Convex HTTP action
  -> stores returned WorkOS tokens in SecureStore
  -> passes the WorkOS JWT to ConvexReactClient

Convex
  -> exchanges auth codes with WorkOS using WORKOS_API_KEY
  -> refreshes WorkOS tokens server-side
  -> validates WorkOS JWTs in convex/auth.config.ts
  -> syncs WorkOS user profile data into Convex
  -> enforces authenticated access in queries and mutations
```

Secrets never belong in the Expo bundle. Keep `WORKOS_API_KEY` and any other confidential values in Convex environment variables.

## Project Layout

- `src/app/`: Expo Router screens and root layout.
- `src/auth/workos-auth.tsx`: WorkOS sign-in, token storage, refresh, and Convex auth bridge.
- `src/lib/convex.ts`: `ConvexReactClient` setup.
- `src/lib/env.ts`: public Expo environment variable handling.
- `convex/auth.config.ts`: Convex WorkOS JWT provider configuration.
- `convex/http.ts`: Convex HTTP routes for WorkOS token exchange and refresh.
- `convex/workos.ts`: server-side WorkOS auth calls.
- `convex/users.ts`: user profile sync and authenticated viewer query.
- `convex/schema.ts`: Convex database schema.
- `eas.json`: EAS build profiles for development, preview, and production.

## Prerequisites

- Node.js 20.19.x or newer for Expo SDK 55.
- Bun.
- Expo account if you plan to use EAS builds.
- Convex account.
- WorkOS account.
- iOS Simulator, Android Emulator, Expo Go, or a development build.

Install dependencies:

```bash
bun install
```

## Start From Scratch

1. Clone or copy this starter into a new repository.

```bash
git clone <your-template-or-repo-url> my-new-app
cd my-new-app
bun install
```

2. Rename the app for your new product.

Update these values before shipping a derived app:

- `package.json` `name`
- `app.json` `expo.name`
- `app.json` `expo.slug`
- `app.json` `expo.scheme`
- `EXPO_PUBLIC_WORKOS_REDIRECT_URI` in your env files and WorkOS Dashboard
- iOS bundle identifier and Android package name if you add them to `app.json`

This starter defaults to:

```text
expo-convex-workos-starter://auth/callback
```

## Create A Convex Application

Run Convex setup from the repository root:

```bash
npx convex dev
```

On first run, Convex will prompt you to sign in and create or select a project. It writes the development deployment identifier to `.env.local` as `CONVEX_DEPLOYMENT`.

Add the public Convex URLs to `.env.local`:

```bash
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
```

You can find these URLs in the Convex dashboard or infer the site URL from the cloud URL by replacing `.convex.cloud` with `.convex.site`.

Set the server-only WorkOS values on the Convex deployment after you create the WorkOS app:

```bash
npx convex env set WORKOS_CLIENT_ID client_...
npx convex env set WORKOS_API_KEY sk_test_...
npx convex env set WORKOS_ALLOWED_ORIGIN "*"
```

Convex environment variables are per deployment. Repeat this setup separately for production, using production WorkOS values:

```bash
npx convex env set --prod WORKOS_CLIENT_ID client_...
npx convex env set --prod WORKOS_API_KEY sk_live_...
npx convex env set --prod WORKOS_ALLOWED_ORIGIN "https://your-production-origin"
```

Deploy Convex functions to production with:

```bash
npx convex deploy
```

## Create A WorkOS Application

In the WorkOS Dashboard:

1. Create or select the environment for local development.
2. Enable User Management / AuthKit if it is not already enabled.
3. Copy the WorkOS Client ID.
4. Copy the WorkOS API key for that environment.
5. Open the Redirects section.
6. Add this redirect URI:

```text
expo-convex-workos-starter://auth/callback
```

7. Add a sign-out redirect location if your logout flow redirects through WorkOS.
8. Configure the auth methods you want, such as email/password, social login, SSO, MFA, organizations, and domain policies.

Redirect URIs must match exactly. If you rename the Expo scheme, update both `EXPO_PUBLIC_WORKOS_REDIRECT_URI` and the WorkOS Dashboard value.

For production, create or switch to a production WorkOS environment, configure the production redirect URI, and use its production `client_...` and `sk_live_...` values in the matching Convex deployment.

## Local Environment

Create a local env file:

```bash
cp .env.example .env.local
```

Fill in:

```bash
CONVEX_DEPLOYMENT=dev:your-convex-deployment
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
EXPO_PUBLIC_WORKOS_CLIENT_ID=client_...
EXPO_PUBLIC_WORKOS_REDIRECT_URI=expo-convex-workos-starter://auth/callback
EXPO_PUBLIC_WORKOS_PROVIDER=authkit
```

Optional values:

```bash
EXPO_PUBLIC_CONVEX_HTTP_URL=
EXPO_PUBLIC_WORKOS_CONNECTION_ID=
EXPO_PUBLIC_WORKOS_ORGANIZATION_ID=
```

Do not put `WORKOS_API_KEY` in `.env.local` for Expo. Set it in Convex with `npx convex env set`.

## Run Locally

Terminal 1:

```bash
npx convex dev
```

Terminal 2:

```bash
bun run start
```

Useful Expo commands from the Metro terminal:

- Press `i` for iOS Simulator.
- Press `a` for Android Emulator.
- Scan the QR code with Expo Go when your native dependencies are supported by Expo Go.

If Metro has stale environment values:

```bash
bun run start -- --clear
```

## EAS Environment Variables

Configure public Expo values per EAS environment:

```bash
eas env:create --environment development --visibility plaintext --name EXPO_PUBLIC_CONVEX_URL --value https://your-dev.convex.cloud
eas env:create --environment development --visibility plaintext --name EXPO_PUBLIC_CONVEX_SITE_URL --value https://your-dev.convex.site
eas env:create --environment development --visibility plaintext --name EXPO_PUBLIC_WORKOS_CLIENT_ID --value client_...
eas env:create --environment development --visibility plaintext --name EXPO_PUBLIC_WORKOS_REDIRECT_URI --value expo-convex-workos-starter://auth/callback
eas env:create --environment development --visibility plaintext --name EXPO_PUBLIC_WORKOS_PROVIDER --value authkit
```

Repeat for `preview` and `production` using the matching Convex deployments and WorkOS environments.

You can pull EAS env values locally with:

```bash
eas env:pull --environment development
```

## Build

Development build:

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

Preview build:

```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

Production build:

```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

Before production builds:

- Set production EAS environment variables.
- Set production Convex environment variables.
- Add production redirect URIs in the production WorkOS environment.
- Deploy Convex with `npx convex deploy`.

## Validation

Type check:

```bash
bunx tsc --noEmit
```

Lint:

```bash
bun run lint
```

Convex push check:

```bash
npx convex dev --once
```

## Security Notes

- Never put `WORKOS_API_KEY` in Expo env vars.
- Keep WorkOS API keys only in Convex environment variables.
- Keep `.env`, `.env.local`, and other local env files out of git.
- Use separate WorkOS environments for development, preview, and production.
- Use separate Convex deployments for development, preview, and production.
- Validate organization and tenant membership in every user-data query or mutation.
- Sync WorkOS user and organization lifecycle events into Convex before relying on local profile state for authorization.

## Reference Docs

- Expo SDK 55 docs: https://docs.expo.dev/versions/v55.0.0/
- Convex CLI docs: https://docs.convex.dev/cli
- Convex environment variables: https://docs.convex.dev/production/environment-variables
- Convex WorkOS AuthKit docs: https://docs.convex.dev/auth/authkit
- WorkOS AuthKit docs: https://workos.com/docs/authkit/remix
