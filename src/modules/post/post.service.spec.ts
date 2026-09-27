import { Test, TestingModule } from "@nestjs/testing";
import { PostService } from "./post.service.js";
import { UserService } from "../user/user.service.js";
import { PostRepository } from "./post.repository.js";
import { PostMapper } from "./post.mapper.js";
import { CreatePostDto } from "./dto/create-post.dto.js";
import postFactory from "../../../test/factories/post-factory.js";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Post } from "./entities/post.entity.js";
import { UpdatePostDto } from "./dto/update-post.dto.js";

describe("PostService", () => {
    let postService: PostService;
    let userService: UserService;
    let postRepository: PostRepository;
    let postMapper: PostMapper;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostService,
                { provide: UserService, useValue: { assertExistsById: vi.fn() } },
                {
                    provide: PostRepository,
                    useValue: {
                        save: vi.fn(),
                        findByUserIdAndTitleContains: vi.fn(),
                        get: vi.fn(),
                        merge: vi.fn(),
                        remove: vi.fn(),
                    },
                },
                { provide: PostMapper, useValue: { toPublicPostDto: vi.fn() } },
            ],
        }).compile();

        postService = module.get<PostService>(PostService);
        userService = module.get<UserService>(UserService);
        postRepository = module.get<PostRepository>(PostRepository);
        postMapper = module.get<PostMapper>(PostMapper);
    });

    it("should be defined", () => {
        expect(postService).toBeDefined();
    });

    describe("create", () => {
        let dto: CreatePostDto;

        beforeEach(() => {
            dto = {
                content: "Some post content",
                title: "Some post title",
                tags: ["dev", "typescript"],
                userId: crypto.randomUUID(),
            };
        });

        it("should create and return a post", async () => {
            const { tags, ...rest } = dto;
            const created = postFactory(rest, tags);
            const publicDto: any = { ...created, tags };

            vi.spyOn(userService, "assertExistsById").mockResolvedValue(undefined);
            vi.spyOn(postRepository, "save").mockResolvedValue(created);
            vi.spyOn(postMapper, "toPublicPostDto").mockResolvedValue(publicDto);

            const result = await postService.create(dto);

            expect(userService.assertExistsById).toHaveBeenCalledWith(dto.userId);
            expect(postRepository.save).toHaveBeenCalledWith(
                { ...dto, tags: tags.map(t => ({ name: t })) },
                { relations: { tags: true, user: true } },
            );
            expect(postMapper.toPublicPostDto).toHaveBeenCalledWith(created);
            expect(result).toEqual(publicDto);
        });

        it("should throw BadRequestException", async () => {
            vi.spyOn(userService, "assertExistsById").mockRejectedValue(new BadRequestException());

            await expect(postService.create(dto)).rejects.toThrow(BadRequestException);

            expect(userService.assertExistsById).toHaveBeenCalledWith(dto.userId);
            expect(postRepository.save).not.toHaveBeenCalled();
            expect(postMapper.toPublicPostDto).not.toHaveBeenCalled();
        });
    });

    describe("findAll", () => {
        it("should return all posts", async () => {
            const posts = [postFactory(), postFactory()];
            const publicPostFn = (post: Post) => ({
                ...post,
                tags: post.tags.map(t => t.name),
            });

            vi.spyOn(postRepository, "findByUserIdAndTitleContains").mockResolvedValue(posts);
            vi.spyOn(postMapper, "toPublicPostDto").mockImplementation(publicPostFn);

            const result = await postService.findAll();

            expect(postRepository.findByUserIdAndTitleContains).toHaveBeenCalledWith(undefined, undefined, {
                relations: { tags: true, user: true },
            });
            expect(postMapper.toPublicPostDto).toHaveBeenCalledTimes(posts.length);
            expect(result).toEqual(posts.map(publicPostFn));
        });

        it("should return all posts filtered", async () => {
            const userId = crypto.randomUUID();
            const title = "tal";
            const posts = [
                postFactory({ userId, title: title + "...." }),
                postFactory({ userId, title: "..." + title }),
            ];
            const publicPostFn = (post: Post) => ({
                ...post,
                tags: post.tags.map(t => t.name),
            });

            vi.spyOn(postRepository, "findByUserIdAndTitleContains").mockResolvedValue(posts);
            vi.spyOn(postMapper, "toPublicPostDto").mockImplementation(publicPostFn);

            const result = await postService.findAll(userId, title);

            expect(postRepository.findByUserIdAndTitleContains).toHaveBeenCalledWith(userId, title, {
                relations: { tags: true, user: true },
            });
            expect(postMapper.toPublicPostDto).toHaveBeenCalledTimes(posts.length);
            expect(result).toEqual(posts.map(publicPostFn));
        });
    });

    describe("findOne", () => {
        it("should return the post with the provided id", async () => {
            const postId = crypto.randomUUID();
            const tags = ["dev", "typescript"];
            const post = postFactory({ id: postId }, tags);
            const publicDto: any = { ...post, tags };

            vi.spyOn(postRepository, "get").mockResolvedValue(post);
            vi.spyOn(postMapper, "toPublicPostDto").mockResolvedValue(publicDto);

            const result = await postService.findOne(postId);

            expect(postRepository.get).toHaveBeenCalledWith(postId, { relations: { tags: true, user: true } });
            expect(postMapper.toPublicPostDto).toHaveBeenCalledWith(post);
            expect(result).toEqual(publicDto);
        });

        it("should throw NotFoundException", async () => {
            const postId = crypto.randomUUID();

            vi.spyOn(postRepository, "get").mockResolvedValue(null);

            await expect(postService.findOne(postId)).rejects.toThrow(NotFoundException);

            expect(postRepository.get).toHaveBeenCalledWith(postId, { relations: { tags: true, user: true } });
            expect(postMapper.toPublicPostDto).not.toHaveBeenCalled();
        });
    });

    describe("update", () => {
        let dto: UpdatePostDto;

        beforeEach(() => {
            dto = {
                content: "Some post content",
                title: "Some post title",
                tags: ["dev", "typescript"],
            };
        });

        it("should update and return a post", async () => {
            const postId = crypto.randomUUID();
            const { tags, ...rest } = dto;
            const updated = postFactory(rest, tags);
            const publicDto: any = { ...updated, tags };
            const mappedInput = { ...dto, tags: tags?.map(t => ({ name: t })) };

            vi.spyOn(postRepository, "merge").mockResolvedValue(updated);
            vi.spyOn(postRepository, "save").mockResolvedValue(updated);
            vi.spyOn(postMapper, "toPublicPostDto").mockResolvedValue(publicDto);

            const result = await postService.update(postId, dto);

            expect(postRepository.merge).toHaveBeenCalledWith(postId, mappedInput);
            expect(postRepository.save).toHaveBeenCalledWith(updated, { relations: { tags: true, user: true } });
            expect(postMapper.toPublicPostDto).toHaveBeenCalledWith(updated);
            expect(result).toEqual(publicDto);
        });

        it("should throw NotFoundException", async () => {
            const postId = crypto.randomUUID();

            vi.spyOn(postRepository, "merge").mockResolvedValue(null);

            await expect(postService.update(postId, dto)).rejects.toThrow(NotFoundException);

            expect(postRepository.merge).toHaveBeenCalledWith(postId, {
                ...dto,
                tags: dto.tags?.map(t => ({ name: t })),
            });
            expect(postRepository.save).not.toHaveBeenCalled();
            expect(postMapper.toPublicPostDto).not.toHaveBeenCalled();
        });
    });

    describe("remove", () => {
        it("should remove the post with the provided id", async () => {
            const postId = crypto.randomUUID();
            const tags = ["dev", "typescript"];
            const post = postFactory({ id: postId }, tags);

            vi.spyOn(postRepository, "get").mockResolvedValue(post);
            vi.spyOn(postRepository, "remove").mockResolvedValue(post);

            const result = await postService.remove(postId);

            expect(postRepository.get).toHaveBeenCalledWith(postId);
            expect(postRepository.remove).toHaveBeenCalledWith(postId);
            expect(result).toEqual(undefined);
        });

        it("should throw NotFoundException", async () => {
            const postId = crypto.randomUUID();

            vi.spyOn(postRepository, "get").mockResolvedValue(null);

            await expect(postService.remove(postId)).rejects.toThrow(NotFoundException);

            expect(postRepository.get).toHaveBeenCalledWith(postId);
            expect(postRepository.remove).not.toHaveBeenCalled();
        });
    });
});
