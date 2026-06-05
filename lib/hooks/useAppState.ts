import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export function useAppState(
  onChange?: (state: AppStateStatus) => void
) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      appState.current = nextState;
      onChange?.(nextState);
    });

    return () => subscription.remove();
  }, [onChange]);

  return appState;
}
