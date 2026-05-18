import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ConvexProviderWithAuth } from 'convex/react';
import React from 'react';
import { useColorScheme } from 'react-native';

import { WorkOSAuthProvider, useWorkOSAuth } from '@/auth/workos-auth';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { convex } from '@/lib/convex';

function ConvexAuthProvider({ children }: React.PropsWithChildren) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useWorkOSAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <WorkOSAuthProvider>
        <ConvexAuthProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
        </ConvexAuthProvider>
      </WorkOSAuthProvider>
    </ThemeProvider>
  );
}
