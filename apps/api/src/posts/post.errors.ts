import { ConflictException, NotFoundException } from '@nestjs/common';

export class PostNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Post ${id} was not found.`);
  }
}

/** The post changed after the client loaded it (optimistic concurrency). */
export class PostVersionConflictException extends ConflictException {
  constructor(id: string, expectedVersion: number) {
    super(
      `Post ${id} was changed by someone else after you loaded version ${expectedVersion}. Reload it and try again.`,
    );
  }
}
