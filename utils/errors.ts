/**
 * Extracts a user-friendly message from a caught error.
 */
export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
