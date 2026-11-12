import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { problemDetailsSchema } from '../common/problem-details.js';
import { toPostResponse } from './post.mapper.js';
import {
  type CreatePostBody,
  createPostSchema,
  type ListPostsQuery,
  listPostsQuerySchema,
  type PostListResponse,
  type PostResponse,
  postIdSchema,
  postListResponseSchema,
  postResponseSchema,
  type UpdatePostBody,
  updatePostSchema,
} from './posts.schemas.js';
import { PostsService } from './posts.service.js';

/** HTTP layer only: validate input, call the service, shape the response. */
@ApiTags('posts')
@ApiBadRequestResponse({
  description: 'Invalid input',
  standardSchema: problemDetailsSchema,
})
@ApiTooManyRequestsResponse({
  description: 'Rate limit exceeded',
  standardSchema: problemDetailsSchema,
})
@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'List posts, newest first' })
  @ApiOkResponse({ standardSchema: postListResponseSchema })
  async list(
    @Query({ schema: listPostsQuerySchema }) query: ListPostsQuery,
  ): Promise<PostListResponse> {
    const result = await this.posts.list({
      page: query.page,
      pageSize: query.pageSize,
      search: query.q,
    });
    return {
      data: result.items.map(toPostResponse),
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post' })
  @ApiOkResponse({ standardSchema: postResponseSchema })
  @ApiNotFoundResponse({ standardSchema: problemDetailsSchema })
  async get(
    @Param('id', { schema: postIdSchema }) id: string,
  ): Promise<PostResponse> {
    return toPostResponse(await this.posts.get(id));
  }

  @Post()
  @ApiOperation({ summary: 'Create a post' })
  @ApiCreatedResponse({
    standardSchema: postResponseSchema,
    headers: {
      Location: {
        description: 'URL of the new post',
        schema: { type: 'string' },
      },
    },
  })
  async create(
    @Body({ schema: createPostSchema }) body: CreatePostBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PostResponse> {
    const post = await this.posts.create(body);
    response.location(`/api/posts/${post.id}`);
    return toPostResponse(post);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a post',
    description:
      'Send the version you edited. If the post changed since, the API ' +
      'answers 409 Conflict instead of overwriting the newer change.',
  })
  @ApiOkResponse({ standardSchema: postResponseSchema })
  @ApiNotFoundResponse({ standardSchema: problemDetailsSchema })
  @ApiConflictResponse({
    description: 'The post changed after the client loaded it',
    standardSchema: problemDetailsSchema,
  })
  async update(
    @Param('id', { schema: postIdSchema }) id: string,
    @Body({ schema: updatePostSchema }) body: UpdatePostBody,
  ): Promise<PostResponse> {
    const { version, ...changes } = body;
    return toPostResponse(await this.posts.update(id, version, changes));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiNoContentResponse({ description: 'The post was deleted' })
  @ApiNotFoundResponse({ standardSchema: problemDetailsSchema })
  async remove(
    @Param('id', { schema: postIdSchema }) id: string,
  ): Promise<void> {
    await this.posts.remove(id);
  }
}
