/**
 * OMDb API Error Handling
 * Error classes and utilities for OMDb API
 */

/** OMDb API Error class for API-specific errors */
export class OMDbError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public isRetryable: boolean = false,
    public originalError?: unknown,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'OMDbError';
    
    // Ensure stack trace is captured
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OMDbError);
    }
  }

  /**
   * Create an OMDbError from an unknown error
   */
  static fromError(error: unknown, code: string = 'UNKNOWN_ERROR', context?: Record<string, unknown>): OMDbError {
    if (error instanceof OMDbError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new OMDbError(
        error.message,
        code,
        undefined,
        false,
        error,
        context
      );
    }
    
    return new OMDbError(
      String(error),
      code,
      undefined,
      false,
      error,
      context
    );
  }

  /**
   * Convert error to a plain object for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
      context: this.context,
      stack: this.stack,
    };
  }
}

/** Legacy alias for backward compatibility */
export const OMDbApiError = OMDbError;

/** Retryable error codes */
export const RETRYABLE_ERROR_CODES = ['NETWORK_ERROR', 'RATE_LIMIT', 'TIMEOUT', 'HTTP_ERROR'];

/** Error code mappings for common OMDb API errors */
export const OMDB_ERROR_CODES = {
  INVALID_API_KEY: 'Invalid API key',
  NOT_FOUND: 'not found',
  TOO_MANY_RESULTS: 'Too many results',
  INCORRECT_IMDB_ID: 'Incorrect IMDb ID',
  PARAMETER_ERROR: 'Parameter',
  REQUEST_LIMIT: 'Request limit',
} as const;