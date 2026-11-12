import { StandardSchemaValidationPipe } from '@nestjs/common';
import {
  type FieldError,
  RequestValidationException,
} from './problem-details.js';

/** The parts of a Standard Schema validation issue this file reads. */
interface SchemaIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
}

/** Converts schema issues into one { field, message } entry per problem. */
export function toFieldErrors(issues: readonly SchemaIssue[]): FieldError[] {
  return issues.map((issue) => {
    const field = issue.path
      ?.map((segment) =>
        String(typeof segment === 'object' ? segment.key : segment),
      )
      .join('.');
    return field
      ? { field, message: issue.message }
      : { message: issue.message };
  });
}

/**
 * Validates every parameter declared with a `schema` option and
 * reports failures as a RequestValidationException.
 */
export function createValidationPipe(): StandardSchemaValidationPipe {
  return new StandardSchemaValidationPipe({
    exceptionFactory: (issues) =>
      new RequestValidationException(toFieldErrors(issues)),
  });
}
