import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

// Configure RevenueCat immediately when this module loads,
// not inside a component's useEffect — this guarantees it
// runs before any screen tries to check premium status.
Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
Purchases.configure({ apiKey: 'test_tKObJYCYuoYorxGTDjpqOAasaoI' });

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}