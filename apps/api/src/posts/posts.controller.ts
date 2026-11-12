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
import type { Response } from 'express';
import { toPostResponse } from './post.mapper.js';
import {
  type CreatePostBody,
  createPostSchema,
  type ListPostsQuery,
  listPostsQuerySchema,
  type PostListResponse,
  type PostResponse,
  postIdSchema,
  type UpdatePostBody,
  updatePostSchema,
} from './posts.schemas.js';
import { PostsService } from './posts.service.js';

/** HTTP layer only: validate input, call the service, shape the response. */
@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
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
  async get(
    @Param('id', { schema: postIdSchema }) id: string,
  ): Promise<PostResponse> {
    return toPostResponse(await this.posts.get(id));
  }

  @Post()
  async create(
    @Body({ schema: createPostSchema }) body: CreatePostBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PostResponse> {
    const post = await this.posts.create(body);
    response.location(`/api/posts/${post.id}`);
    return toPostResponse(post);
  }

  @Patch(':id')
  async update(
    @Param('id', { schema: postIdSchema }) id: string,
    @Body({ schema: updatePostSchema }) body: UpdatePostBody,
  ): Promise<PostResponse> {
    const { version, ...changes } = body;
    return toPostResponse(await this.posts.update(id, version, changes));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', { schema: postIdSchema }) id: string,
  ): Promise<void> {
    await this.posts.remove(id);
  }
}
