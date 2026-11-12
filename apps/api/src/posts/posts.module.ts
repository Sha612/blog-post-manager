import { Module } from '@nestjs/common';
import { PrismaPostsRepository } from './prisma-posts.repository.js';
import { PostsController } from './posts.controller.js';
import { PostsRepository } from './posts.repository.js';
import { PostsService } from './posts.service.js';

@Module({
  controllers: [PostsController],
  providers: [
    PostsService,
    { provide: PostsRepository, useClass: PrismaPostsRepository },
  ],
})
export class PostsModule {}
