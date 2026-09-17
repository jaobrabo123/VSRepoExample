import { Injectable, NotFoundException } from "@nestjs/common";
import { CreatePostDto } from "./dto/create-post.dto.js";
import { UpdatePostDto } from "./dto/update-post.dto.js";
import { PostRepository } from "./post.repository.js";
import { UserService } from "../user/user.service.js";
import { PublicPostDto } from "./dto/public-post.dto.js";
import { PostMapper } from "./post.mapper.js";

@Injectable()
export class PostService {
    constructor(
        private readonly postRepository: PostRepository,
        private readonly userService: UserService,
        private readonly postMapper: PostMapper,
    ) {}

    private assertExists<T>(post: T): asserts post is NonNullable<T> {
        if (!post) {
            throw new NotFoundException("Post not found");
        }
    }

    async create(dto: CreatePostDto) {
        await this.userService.assertExistsById(dto.userId);
        const post = await this.postRepository.save(
            { ...dto, tags: dto.tags.map(t => ({ name: t })) },
            { relations: { tags: true, user: true } },
        );

        return this.postMapper.toPublicPostDto(post);
    }

    async findAll(userId?: string, title?: string): Promise<PublicPostDto[]> {
        const posts = await this.postRepository.findByUserIdAndTitleContains(userId, title, {
            relations: { tags: true, user: true },
        });

        return posts.map(p => this.postMapper.toPublicPostDto(p));
    }

    async findOne(id: string): Promise<PublicPostDto> {
        const post = await this.postRepository.get(id, { relations: { tags: true, user: true } });
        this.assertExists(post);

        return this.postMapper.toPublicPostDto(post);
    }

    async update(id: string, dto: UpdatePostDto): Promise<PublicPostDto> {
        const post = await this.postRepository.merge(id, { ...dto, tags: dto.tags?.map(t => ({ name: t })) });
        this.assertExists(post);

        const postUpdated = await this.postRepository.save(post, { relations: { tags: true, user: true } });
        return this.postMapper.toPublicPostDto(postUpdated);
    }

    async remove(id: string): Promise<void> {
        const post = await this.postRepository.get(id);
        this.assertExists(post);

        await this.postRepository.remove(post.id);
    }
}
