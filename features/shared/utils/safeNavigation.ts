import { router } from 'expo-router';

/**
 * Safely navigates back without triggering React Navigation unhandled 'GO_BACK' action warnings.
 * First checks if the current navigator has history to pop.
 * If not, checks if any parent navigator has history to pop.
 * If neither can go back (e.g. deep link or page refresh), falls back to router.replace with the fallback route.
 */
export function safeGoBack(navigation: any, fallbackRoute: string = '/home') {
  try {
    if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    const parent = navigation?.getParent?.();
    if (parent && typeof parent.canGoBack === 'function' && parent.canGoBack()) {
      parent.goBack();
      return;
    }
  } catch {
    // If navigation tree inspection fails, safely fallback
  }

  try {
    router.replace(fallbackRoute as any);
  } catch {
    router.navigate(fallbackRoute as any);
  }
}
