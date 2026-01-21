import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LanguageProvider } from '@/lib/LanguageContext';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Check auth state on mount and whenever it changes
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      const inAuthGroup = segments[0] === '(auth)';

      if (session && inAuthGroup) {
        // Redirect to tabs if logged in and in auth group
        router.replace('/(tabs)');
      } else if (!session && !inAuthGroup) {
        // Redirect to auth if not logged in and not in auth group
        router.replace('/(auth)');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const inAuthGroup = segments[0] === '(auth)';

      if (session && inAuthGroup) {
        router.replace('/(tabs)');
      } else if (!session && !inAuthGroup) {
        router.replace('/(auth)');
      }
    });

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [segments]);

  return (
    <LanguageProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </LanguageProvider>
  );
}
