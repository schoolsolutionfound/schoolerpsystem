const time = () => new Date().toISOString().slice(11, 23);

export function debugLog(scope: string, message: string, data?: unknown) {
  if (!__DEV__) return;
  if (data === undefined) {
    console.log(`[${scope}] ${time()} ${message}`);
  } else {
    console.log(`[${scope}] ${time()} ${message}`, data);
  }
}

export function debugWarn(scope: string, message: string, data?: unknown) {
  if (!__DEV__) return;
  if (data === undefined) {
    console.warn(`[${scope}] ${time()} ${message}`);
  } else {
    console.warn(`[${scope}] ${time()} ${message}`, data);
  }
}

export function debugError(scope: string, message: string, data?: unknown) {
  if (!__DEV__) return;
  if (data === undefined) {
    console.error(`[${scope}] ${time()} ${message}`);
  } else {
    console.error(`[${scope}] ${time()} ${message}`, data);
  }
}
