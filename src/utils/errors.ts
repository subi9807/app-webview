export class AppError extends Error {
  code: string;
  details?: any;
  timestamp: number;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

export class LocationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'LOCATION_ERROR', details);
    this.name = 'LocationError';
  }
}

export class BluetoothError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'BLUETOOTH_ERROR', details);
    this.name = 'BluetoothError';
  }
}

export class FirebaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'FIREBASE_ERROR', details);
    this.name = 'FirebaseError';
  }
}

export class PermissionError extends AppError {
  constructor(message: string, permissionType?: string) {
    super(message, 'PERMISSION_DENIED', { permissionType });
    this.name = 'PermissionError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export function handleError(error: unknown, context: string): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', { context });
  }

  return new AppError(String(error), 'UNKNOWN_ERROR', { context });
}
