/**
 * Extracts a backend-provided error message from an Axios error caught as `unknown`,
 * falling back to a generic message when the shape doesn't match.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response &&
    err.response.data &&
    typeof err.response.data === "object" &&
    "message" in err.response.data &&
    typeof err.response.data.message === "string"
  ) {
    return err.response.data.message;
  }

  return fallback;
}

/**
 * Extracts the HTTP status code from an Axios error caught as `unknown`, if present.
 */
export function getErrorStatus(err: unknown): number | undefined {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "status" in err.response &&
    typeof err.response.status === "number"
  ) {
    return err.response.status;
  }

  return undefined;
}
