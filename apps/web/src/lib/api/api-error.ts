/** One invalid field, as reported by the API. */
export interface FieldError {
  field?: string;
  message: string;
}

/** RFC 9457 problem details: the error format of every API response. */
export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  requestId?: string;
  errors?: FieldError[];
}

/** A failed API call, carrying the problem details the API returned. */
export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
    this.status = problem.status;
    this.problem = problem;
  }

  get requestId(): string | undefined {
    return this.problem.requestId;
  }

  get fieldErrors(): FieldError[] {
    return this.problem.errors ?? [];
  }

  static fromResponse(status: number, body: unknown): ApiError {
    if (isProblemDetails(body)) {
      return new ApiError({ ...body, status });
    }
    return new ApiError({
      title: "Unexpected response",
      status,
      detail: `The API answered with status ${status}.`,
    });
  }

  static unreachable(): ApiError {
    return new ApiError({
      title: "Service Unavailable",
      status: 503,
      detail:
        "The API could not be reached. Make sure it is running, then try again.",
    });
  }
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<ProblemDetails>;
  return (
    typeof candidate.title === "string" && typeof candidate.status === "number"
  );
}
