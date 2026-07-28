import { Alert } from 'react-native';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: string = 'APP_ERROR', statusCode: number = 400, isOperational: boolean = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function handleGlobalError(error: unknown, fallbackMessage: string = 'An unexpected error occurred. Please try again.') {
  const isDev = __DEV__ || process.env.NODE_ENV === 'development';

  if (error instanceof AppError) {
    if (isDev) {
      console.warn(`[AppError] Code: ${error.code} | Message: ${error.message}`);
    }
    Alert.alert('Error', error.message);
    return error.message;
  }

  const errMessage = error instanceof Error ? error.message : String(error);

  if (isDev) {
    console.error('[Unhandled Development Error]:', error);
    Alert.alert('Dev Error', `${errMessage}\n\n(This detailed stack trace is hidden in production)`);
  } else {
    console.error('[Production Error Logged]:', errMessage);
    Alert.alert('Error', fallbackMessage);
  }

  return isDev ? errMessage : fallbackMessage;
}
