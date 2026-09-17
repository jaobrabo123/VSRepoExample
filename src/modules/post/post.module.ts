import { Module } from "@nestjs/common";
import { PostService } from "./post.service.js";
import { PostController } from "./post.controller.js";
import { PostRepository } from "./post.repository.js";
import { PrismaModule } from "../../infra/prisma/prisma.module.js";
import { UserModule } from "../user/user.module.js";
import { PostMapper } from "./post.mapper.js";

@Module({
    imports: [PrismaModule, UserModule],
    controllers: [PostController],
    providers: [PostService, PostRepository, PostMapper],
})
export class PostModule {}
