import { ApiError } from "@/lib/api/api-error";
/** An error a Server Action reports back to the component that called it. */
export interface ActionError {
  status: number;
  message: string;
  /** Messages keyed by field name, e.g. { title: "Title is required." } */
  fieldErrors?: Record<string, string>;
  /** Matches the API's log lines for this request. */
  requestId?: string;
}
/**
 * What every Server Action returns. Actions report failures as values
 * instead of throwing, because thrown errors lose their details on the way
 * to the browser in production.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };
/** Converts anything a Server Action caught into a serialisable error. */
export function toActionError(error: unknown): ActionError {
  if (!(error instanceof ApiError)) {
    console.error("Unexpected error in a Server Action", error);
    return { status: 500, message: "Something went wrong. Please try again." };
  }
  const fieldErrors = Object.fromEntries(
    error.fieldErrors.flatMap((fieldError) =>
      fieldError.field ? [[fieldError.field, fieldError.message]] : [],
    ),
  );
  return {
    status: error.status,
    message: error.message,
    ...(Object.keys(fieldErrors).length > 0 && { fieldErrors }),
    ...(error.requestId && { requestId: error.requestId }),
  };
}
