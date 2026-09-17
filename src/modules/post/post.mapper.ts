import { Injectable } from "@nestjs/common";
import { Post } from "./entities/post.entity.js";
import { PublicPostDto } from "./dto/public-post.dto.js";
import { UserMapper } from "../user/user.mapper.js";

@Injectable()
export class PostMapper {
    constructor(private readonly userMapper: UserMapper) {}

    toPublicPostDto(post: Post): PublicPostDto {
        return {
            content: post.content,
            createdAt: post.createdAt,
            id: post.id,
            tags: post.tags.map(t => t.name),
            title: post.title,
            updatedAt: post.updatedAt,
            user: this.userMapper.toPublicUserDto(post.user),
            userId: post.userId,
        };
    }
}
