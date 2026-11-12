import { describe, expect, it } from 'vitest';
import { escapeLikePattern } from '../prisma-posts.repository.js';

describe('escapeLikePattern', () => {
  it('escapes the LIKE wildcards and the escape character', () => {
    expect(escapeLikePattern('100%')).toBe('100\\%');
    expect(escapeLikePattern('user_id')).toBe('user\\_id');
    expect(escapeLikePattern('C:\\temp')).toBe('C:\\\\temp');
  });

  it('leaves ordinary text unchanged', () => {
    expect(escapeLikePattern('Learning NestJS')).toBe('Learning NestJS');
  });
});
