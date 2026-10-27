import { useEffect } from 'react';
import { debugLog } from '../../../utils/debugLogger';

export function useDebugTab(role: string, tab: unknown) {
  useEffect(() => {
    debugLog('TAB', `${role} tab changed`, { role, tab });
  }, [role, tab]);
}
