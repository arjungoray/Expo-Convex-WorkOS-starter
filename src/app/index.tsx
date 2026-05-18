import { Authenticated, AuthLoading, Unauthenticated, useQuery } from 'convex/react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWorkOSAuth } from '@/auth/workos-auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { api } from '@convex/_generated/api';

function SignInPanel() {
  const { signIn } = useWorkOSAuth();

  return (
    <ThemedView type="backgroundElement" style={styles.panel}>
      <ThemedText type="subtitle">Authentication required</ThemedText>
      <ThemedText>
        Sign in with WorkOS to connect the Expo client to Convex with a verified JWT.
      </ThemedText>
      <Pressable accessibilityRole="button" onPress={signIn} style={styles.primaryButton}>
        <ThemedText style={styles.primaryButtonText}>Sign in</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

function ViewerPanel() {
  const { signOut, organizationId } = useWorkOSAuth();
  const viewer = useQuery(api.users.viewer);
  const email = viewer?.profile?.email ?? viewer?.identity.email ?? 'Signed in';

  return (
    <ThemedView type="backgroundElement" style={styles.panel}>
      <ThemedText type="subtitle">{email}</ThemedText>
      <ThemedText type="small">
        Convex authenticated this session with WorkOS subject {viewer?.identity.subject}.
      </ThemedText>
      <ThemedText type="small">
        Organization: {viewer?.profile?.organizationId ?? organizationId ?? 'none'}
      </ThemedText>
      <Pressable accessibilityRole="button" onPress={signOut} style={styles.secondaryButton}>
        <ThemedText>Sign out</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Expo Convex WorkOS Starter
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Expo mobile, WorkOS identity, Convex realtime data.
          </ThemedText>
        </ThemedView>

        <AuthLoading>
          <ThemedView type="backgroundElement" style={styles.panel}>
            <ActivityIndicator />
            <ThemedText>Checking session</ThemedText>
          </ThemedView>
        </AuthLoading>

        <Unauthenticated>
          <SignInPanel />
        </Unauthenticated>

        <Authenticated>
          <ViewerPanel />
        </Authenticated>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  header: {
    gap: Spacing.two,
  },
  title: {
    textAlign: 'left',
  },
  subtitle: {
    maxWidth: 480,
  },
  panel: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.two,
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#208AEF',
    borderRadius: Spacing.two,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});
