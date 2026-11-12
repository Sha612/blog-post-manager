import { BadRequestException } from '@nestjs/common';

export interface FieldError {
  /** Dot-separated path of the invalid field, e.g. "title". */
  field?: string;
  message: string;
}

/**
 * RFC 9457 "Problem Details for HTTP APIs": the single error shape every
 * endpoint returns, with the request id that links it to the server logs.
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  requestId?: string;
  errors?: FieldError[];
}

/** Thrown by the validation pipe; carries one entry per invalid field. */
export class RequestValidationException extends BadRequestException {
  constructor(readonly errors: FieldError[]) {
    super('The request contains invalid fields.');
  }
}
