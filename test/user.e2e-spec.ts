import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication, UnprocessableEntityException, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types.js";
import { UserModule } from "../src/modules/user/user.module.js";
import { PrismaModule } from "../src/infra/prisma/prisma.module.js";
import { ConfigModule } from "@nestjs/config";
import appConfig from "../src/config/app.config.js";
import { APP_PIPE } from "@nestjs/core";
import { PrismaService } from "../src/infra/prisma/prisma.service.js";
import createUserHelper from "./helpers/create-user.helper.js";
import { PublicUserDto } from "../src/modules/user/dto/public-user.dto.js";

describe("UserController (e2e)", () => {
    let app: INestApplication<App>;
    let prismaService: PrismaService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                UserModule,
                PrismaModule,
                ConfigModule.forRoot({ isGlobal: true, load: [appConfig], envFilePath: ".env.test" }),
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

    describe("/users (POST)", () => {
        it("should create and return a user without leaking the password", async () => {
            const response = await request(app.getHttpServer())
                .post("/users")
                .send({ name: "Joao", email: "joao@email.com", password: "!Str0ngPassword" })
                .expect(HttpStatus.CREATED);

            expect(response.body).toEqual({
                createdAt: expect.any(String),
                email: "joao@email.com",
                id: expect.any(String),
                name: "Joao",
                updatedAt: expect.any(String),
            } satisfies PublicUserDto);
            expect(response.body).not.toHaveProperty("password");
        });

        it("should return a UnprocessableEntityException", async () => {
            const response = await request(app.getHttpServer())
                .post("/users")
                .send({ name: "", email: "not-an-email", password: "123" })
                .expect(HttpStatus.UNPROCESSABLE_ENTITY);

            expect(response.body).toEqual(expect.objectContaining({ error: "Unprocessable Entity", statusCode: 422 }));
        });

        it("should return a ConflictException", async () => {
            await createUserHelper(app, { email: "duplicated@email.com" });

            const response = await request(app.getHttpServer())
                .post("/users")
                .send({ name: "Other", email: "duplicated@email.com", password: "!Str0ngPassword" })
                .expect(HttpStatus.CONFLICT);

            expect(response.body).toEqual(expect.objectContaining({ error: "Conflict", statusCode: 409 }));
        });
    });

    describe("/users (GET)", () => {
        it("should return all users", async () => {
            const user = await createUserHelper(app, { name: "Joao", email: "joao@email.com" });
            const otherUser = await createUserHelper(app, { name: "Maria", email: "maria@email.com" });

            const response = await request(app.getHttpServer()).get("/users").expect(HttpStatus.OK);

            expect(response.body).toHaveLength(2);
            expect(response.body).toEqual(
                expect.arrayContaining([
                    {
                        createdAt: user.createdAt,
                        email: user.email,
                        id: user.id,
                        name: user.name,
                        updatedAt: user.updatedAt,
                    } satisfies PublicUserDto,
                    {
                        createdAt: otherUser.createdAt,
                        email: otherUser.email,
                        id: otherUser.id,
                        name: otherUser.name,
                        updatedAt: otherUser.updatedAt,
                    } satisfies PublicUserDto,
                ]),
            );
        });

        it("should return only the users whose name starts with the provided name", async () => {
            const user = await createUserHelper(app, { name: "Joao", email: "joao@email.com" });
            await createUserHelper(app, { name: "Maria", email: "maria@email.com" });

            const response = await request(app.getHttpServer())
                .get("/users")
                .query({ name: "Jo" })
                .expect(HttpStatus.OK);

            expect(response.body).toEqual([
                {
                    createdAt: user.createdAt,
                    email: user.email,
                    id: user.id,
                    name: user.name,
                    updatedAt: user.updatedAt,
                } satisfies PublicUserDto,
            ]);
        });
    });

    describe("/users (GET /:id)", () => {
        it("should return the user with the provided id", async () => {
            const user = await createUserHelper(app);

            const response = await request(app.getHttpServer()).get(`/users/${user.id}`).expect(HttpStatus.OK);

            expect(response.body).toEqual({
                createdAt: user.createdAt,
                email: user.email,
                id: user.id,
                name: user.name,
                updatedAt: user.updatedAt,
            } satisfies PublicUserDto);
        });

        it("should return a BadRequestException", async () => {
            const response = await request(app.getHttpServer()).get("/users/no-uuid").expect(HttpStatus.BAD_REQUEST);

            expect(response.body).toEqual(expect.objectContaining({ error: "Bad Request", statusCode: 400 }));
        });

        it("should return a NotFoundException", async () => {
            const response = await request(app.getHttpServer())
                .get(`/users/${crypto.randomUUID()}`)
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body).toEqual(expect.objectContaining({ error: "Not Found", statusCode: 404 }));
        });
    });

    describe("/users (PATCH /:id)", () => {
        it("should update and return the user", async () => {
            const user = await createUserHelper(app, { name: "Joao", email: "joao@email.com" });

            const response = await request(app.getHttpServer())
                .patch(`/users/${user.id}`)
                .send({ name: "Joao Silva", email: "joao.silva@email.com" })
                .expect(HttpStatus.OK);

            expect(response.body).toEqual({
                createdAt: user.createdAt,
                email: "joao.silva@email.com",
                id: user.id,
                name: "Joao Silva",
                updatedAt: expect.any(String),
            } satisfies PublicUserDto);
        });

        it("should return a ConflictException", async () => {
            const user = await createUserHelper(app, { email: "joao@email.com" });
            await createUserHelper(app, { email: "maria@email.com" });

            const response = await request(app.getHttpServer())
                .patch(`/users/${user.id}`)
                .send({ email: "maria@email.com" })
                .expect(HttpStatus.CONFLICT);

            expect(response.body).toEqual(expect.objectContaining({ error: "Conflict", statusCode: 409 }));
        });
    });

    describe("/users (DELETE /:id)", () => {
        it("should soft delete the user", async () => {
            const user = await createUserHelper(app);

            await request(app.getHttpServer()).delete(`/users/${user.id}`).expect(HttpStatus.NO_CONTENT);

            await request(app.getHttpServer()).get(`/users/${user.id}`).expect(HttpStatus.NOT_FOUND);

            const response = await request(app.getHttpServer()).get("/users").expect(HttpStatus.OK);

            expect(response.body).toEqual([]);
        });

        it("should return a NotFoundException", async () => {
            const response = await request(app.getHttpServer())
                .delete(`/users/${crypto.randomUUID()}`)
                .expect(HttpStatus.NOT_FOUND);

            expect(response.body).toEqual(expect.objectContaining({ error: "Not Found", statusCode: 404 }));
        });
    });
});
