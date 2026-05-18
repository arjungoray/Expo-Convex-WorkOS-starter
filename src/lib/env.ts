const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
export function requirePublicEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required public environment variable: ${name}`);
  }
  return value;
}

export const publicEnv = {
  convexUrl: requirePublicEnv('EXPO_PUBLIC_CONVEX_URL', convexUrl),
  convexHttpUrl:
    process.env.EXPO_PUBLIC_CONVEX_HTTP_URL ??
    process.env.EXPO_PUBLIC_CONVEX_SITE_URL ??
    requirePublicEnv('EXPO_PUBLIC_CONVEX_URL', convexUrl).replace(
      '.convex.cloud',
      '.convex.site',
    ),
  workosClientId: process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID,
  workosRedirectUri:
    process.env.EXPO_PUBLIC_WORKOS_REDIRECT_URI ??
    'expo-convex-workos-starter://auth/callback',
  workosProvider: process.env.EXPO_PUBLIC_WORKOS_PROVIDER ?? 'authkit',
  workosConnectionId: process.env.EXPO_PUBLIC_WORKOS_CONNECTION_ID,
  workosOrganizationId: process.env.EXPO_PUBLIC_WORKOS_ORGANIZATION_ID,
};
