import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication, UnprocessableEntityException, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types.js";
import { UserModule } from "../src/modules/user/user.module.js";
import { PrismaModule } from "../src/infra/prisma/prisma.module.js";
import { ConfigModule } from "@nestjs/config";
import { PostModule } from "../src/modules/post/post.module.js";
import appConfig from "../src/config/app.config.js";
import { APP_PIPE } from "@nestjs/core";
import { PrismaService } from "../src/infra/prisma/prisma.service.js";
import createUserHelper from "./helpers/create-user.helper.js";
import { CreatePostDto } from "../src/modules/post/dto/create-post.dto.js";
import { PublicPostDto } from "../src/modules/post/dto/public-post.dto.js";
import postFactory from "./factories/post-factory.js";

describe("PostController (e2e)", () => {
    let app: INestApplication<App>;
    let prismaService: PrismaService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                UserModule,
                PrismaModule,
                ConfigModule.forRoot({ isGlobal: true, load: [appConfig], envFilePath: ".env.test" }),
                PostModule,
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useValue: new ValidationPipe({
                        whitelist: true,
                        transform: true,
                        forbidNonWhitelisted: true,
                        exceptionFactory: errors => new UnprocessableEntityException(errors),
                    }),
                },
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        prismaService = app.get<PrismaService>(PrismaService);
        await app.init();
    });

    beforeEach(async () => {
        await prismaService.user.deleteMany();
    });

    afterEach(async () => {
        await app.close();
    });

    afterAll(async () => {
        await prismaService.user.deleteMany();
    });

    describe("/posts (POST)", () => {
        let dto: CreatePostDto;

        beforeEach(() => {
            dto = {
                content: "Some post content",
                title: "Some post title",
                tags: ["dev", "typescript"],
                userId: crypto.randomUUID(),
            };
        });

        it("should create and return an post", async () => {
            const user = await createUserHelper(app);

            dto.userId = user.id;

            const response = await request(app.getHttpServer()).post("/posts").send(dto).expect(HttpStatus.CREATED);

            expect(response.body).toEqual({
                content: dto.content,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                id: expect.any(String),
                tags: dto.tags,
                title: dto.title,
                user: {
                    createdAt: user.createdAt,
                    email: user.email,
                    id: user.id,
                    name: user.name,
                    updatedAt: user.updatedAt,
                },
                userId: user.id,
            } satisfies PublicPostDto);
        });

        it("should return a BadRequestException", async () => {
            const response = await request(app.getHttpServer()).post("/posts").send(dto).expect(HttpStatus.BAD_REQUEST);

            expect(response.body).toEqual(expect.objectContaining({ error: "Bad Request", statusCode: 400 }));
        });

        it("should return a UnprocessableEntityException", async () => {
            dto.userId = "no uuid";
            dto.content = dto.content.repeat(200);
            dto.title = dto.content.repeat(20);
            dto.tags = dto.tags.map(tag => tag.repeat(20));

            const response = await request(app.getHttpServer())
                .post("/posts")
                .send(dto)
                .expect(HttpStatus.UNPROCESSABLE_ENTITY);

            expect(response.body).toEqual(expect.objectContaining({ error: "Unprocessable Entity", statusCode: 422 }));
        });
    });

    describe("/posts (GET)", () => {
        it("should return the posts with the nested user and tags", async () => {
            const user = await createUserHelper(app);
            const post = postFactory({ userId: user.id });

            await request(app.getHttpServer())
                .post("/posts")
                .send({ content: post.content, title: post.title, tags: ["dev", "typescript"], userId: user.id })
                .expect(HttpStatus.CREATED);

            const response = await request(app.getHttpServer())
                .get("/posts")
                .query({ userId: user.id })
                .expect(HttpStatus.OK);

            expect(response.body).toEqual([
                {
                    content: post.content,
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String),
                    id: expect.any(String),
                    tags: ["dev", "typescript"],
                    title: post.title,
                    user: {
                        createdAt: user.createdAt,
                        email: user.email,
                        id: user.id,
                        name: user.name,
                        updatedAt: user.updatedAt,
                    },
                    userId: user.id,
                } satisfies PublicPostDto,
            ]);
        });

        it("should return only the posts matching the userId and title filters", async () => {
            const user = await createUserHelper(app);
            const otherUser = await createUserHelper(app, { email: "other@email.com" });
            const posts = [
                postFactory({ title: "Typescript tips", userId: user.id }),
                postFactory({ title: "Something else", userId: user.id }),
                postFactory({ title: "Typescript tips", userId: otherUser.id }),
            ];

            for (const post of posts) {
                await request(app.getHttpServer())
                    .post("/posts")
                    .send({ content: post.content, title: post.title, tags: ["dev"], userId: post.userId })
                    .expect(HttpStatus.CREATED);
            }

            const response = await request(app.getHttpServer())
                .get("/posts")
                .query({ userId: user.id, title: "Typescript" })
                .expect(HttpStatus.OK);

            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toEqual(
                expect.objectContaining({ title: posts[0].title, userId: user.id }) satisfies PublicPostDto,
            );
        });

        it("should return all posts when no userId is provided", async () => {
            const user = await createUserHelper(app);
            const otherUser = await createUserHelper(app, { email: "other@email.com" });
            const post = postFactory({ userId: user.id });
            const otherPost = postFactory({ userId: otherUser.id });

            for (const p of [post, otherPost]) {
                await request(app.getHttpServer())
                    .post("/posts")
                    .send({ content: p.content, title: p.title, tags: ["dev", "typescript"], userId: p.userId })
                    .expect(HttpStatus.CREATED);
            }

            const response = await request(app.getHttpServer()).get("/posts").expect(HttpStatus.OK);

            expect(response.body).toHaveLength(2);
            expect(response.body).toEqual(
                expect.arrayContaining([
                    {
                        content: post.content,
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String),
                        id: expect.any(String),
                        tags: ["dev", "typescript"],
                        title: post.title,
                        user: {
                            createdAt: user.createdAt,
                            email: user.email,
                            id: user.id,
                            name: user.name,
                            updatedAt: user.updatedAt,
                        },
                        userId: user.id,
                    } satisfies PublicPostDto,
                    {
                        content: otherPost.content,
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String),
                        id: expect.any(String),
                        tags: ["dev", "typescript"],
                        title: otherPost.title,
                        user: {
                            createdAt: otherUser.createdAt,
                            email: otherUser.email,
                            id: otherUser.id,
                            name: otherUser.name,
                            updatedAt: otherUser.updatedAt,
                        },
                        userId: otherUser.id,
                    } satisfies PublicPostDto,
                ]),
            );
        });

        it("should return a BadRequestException when the userId is not a uuid", async () => {
            const response = await request(app.getHttpServer())
                .get("/posts")
                .query({ userId: "not-a-uuid" })
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body).toEqual(expect.objectContaining({ error: "Bad Request", statusCode: 400 }));
        });
    });

    describe("/posts (GET /:id)", () => {
        it("should return the post with the provided id", async () => {
            const user = await createUserHelper(app);
            const post = postFactory({ userId: user.id });

            const created = await request(app.getHttpServer())
                .post("/posts")
                .send({ content: post.content, title: post.title, tags: ["dev", "typescript"], userId: user.id })
                .expect(HttpStatus.CREATED);

            const response = await request(app.getHttpServer()).get(`/posts/${created.body.id}`).expect(HttpStatus.OK);

            expect(response.body).toEqual(created.body satisfies PublicPostDto);
        });

        it("should return a BadRequestException", async () => {
            const response = await request(app.getHttpServer()).get("/posts/no-uuid").expect(HttpStatus.BAD_REQUEST);

            expect(response.body).toEqual(expect.objectContaining({ error: "Bad Request", statusCode: 400 }));
        });

        it("should return a NotFoundException", async () => {
            const response = await request(app.getHttpServer())
                .get(`/posts/${crypto.randomUUID()}`)
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body).toEqual(expect.objectContaining({ error: "Not Found", statusCode: 404 }));
        });
    });

    describe("/posts (PATCH /:id)", () => {
        it("should update and return the post", async () => {
            const user = await createUserHelper(app);
            const post = postFactory({ userId: user.id });

            const created = await request(app.getHttpServer())
                .post("/posts")
                .send({ content: post.content, title: post.title, tags: ["dev", "typescript"], userId: user.id })
                .expect(HttpStatus.CREATED);

            const response = await request(app.getHttpServer())
                .patch(`/posts/${created.body.id}`)
                .send({ content: "Updated content", title: "Updated title", tags: ["updated"] })
                .expect(HttpStatus.OK);

            expect(response.body).toEqual({
                content: "Updated content",
                createdAt: created.body.createdAt,
                updatedAt: expect.any(String),
                id: created.body.id,
                tags: ["updated"],
                title: "Updated title",
                user: created.body.user,
                userId: user.id,
            } satisfies PublicPostDto);
        });

        it("should return a NotFoundException", async () => {
            const response = await request(app.getHttpServer())
                .patch(`/posts/${crypto.randomUUID()}`)
                .send({ title: "Updated title" })
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body).toEqual(expect.objectContaining({ error: "Not Found", statusCode: 404 }));
        });
    });

    describe("/posts (DELETE /:id)", () => {
        it("should delete the post", async () => {
            const user = await createUserHelper(app);
            const post = postFactory({ userId: user.id });

            const created = await request(app.getHttpServer())
                .post("/posts")
                .send({ content: post.content, title: post.title, tags: ["dev", "typescript"], userId: user.id })
                .expect(HttpStatus.CREATED);

            await request(app.getHttpServer()).delete(`/posts/${created.body.id}`).expect(HttpStatus.NO_CONTENT);

            await request(app.getHttpServer()).get(`/posts/${created.body.id}`).expect(HttpStatus.NOT_FOUND);
        });

        it("should return a NotFoundException", async () => {
            const response = await request(app.getHttpServer())
                .delete(`/posts/${crypto.randomUUID()}`)
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body).toEqual(expect.objectContaining({ error: "Not Found", statusCode: 404 }));
        });
    });
});
