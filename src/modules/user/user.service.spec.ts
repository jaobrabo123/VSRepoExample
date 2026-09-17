import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "./user.service.js";
import { UserRepository } from "./user.repository.js";
import { UserMapper } from "./user.mapper.js";
import { CreateUserDto } from "./dto/create-user.dto.js";
import userFactory from "../../../test/factories/user.factory.js";
import { PublicUserDto } from "./dto/public-user.dto.js";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { User } from "./entities/user.entity.js";
import { UpdateUserDto } from "./dto/update-user.dto.js";

describe("UserService", () => {
    let userService: UserService;
    let userRepository: UserRepository;
    let userMapper: UserMapper;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: UserRepository,
                    useValue: {
                        save: vi.fn(),
                        existsByEmail: vi.fn(),
                        findByNameStartsWith: vi.fn(),
                        get: vi.fn(),
                        softRemove: vi.fn(),
                        patch: vi.fn(),
                        has: vi.fn(),
                    },
                },
                { provide: UserMapper, useValue: { toPublicUserDto: vi.fn() } },
            ],
        }).compile();

        userService = module.get<UserService>(UserService);
        userRepository = module.get<UserRepository>(UserRepository);
        userMapper = module.get<UserMapper>(UserMapper);
    });

    it("should be defined", () => {
        expect(userService).toBeDefined();
    });

    describe("assertEmailIsAvailable", () => {
        it("should do nothing", async () => {
            const email = "test@email.com";

            vi.spyOn(userRepository, "existsByEmail").mockResolvedValue(false);

            const result = await userService.assertEmailIsAvailable(email);

            expect(userRepository.existsByEmail).toHaveBeenCalledWith(email, expect.objectContaining({ see: "all" }));
            expect(result).toBeUndefined();
        });

        it("should throw ConflictException", async () => {
            const email = "test@email.com";

            vi.spyOn(userRepository, "existsByEmail").mockResolvedValue(true);

            await expect(userService.assertEmailIsAvailable(email)).rejects.toThrow(ConflictException);

            expect(userRepository.existsByEmail).toHaveBeenCalledWith(email, expect.objectContaining({ see: "all" }));
        });
    });

    describe("create", () => {
        it("should create and return a user", async () => {
            const dto: CreateUserDto = { email: "joao@email.com", name: "Joao", password: "12345678" };
            const createdUser = userFactory(dto);
            const publicUser: PublicUserDto = {
                createdAt: createdUser.createdAt,
                email: createdUser.email,
                id: createdUser.id,
                name: createdUser.name,
                updatedAt: createdUser.updatedAt,
            };

            vi.spyOn(userService, "assertEmailIsAvailable").mockResolvedValue(undefined);
            vi.spyOn(userRepository, "save").mockResolvedValue(createdUser);
            vi.spyOn(userMapper, "toPublicUserDto").mockResolvedValue(publicUser);

            const result = await userService.create(dto);

            expect(userService.assertEmailIsAvailable).toHaveBeenCalledWith(dto.email);
            expect(userRepository.save).toHaveBeenCalledWith(dto);
            expect(userMapper.toPublicUserDto).toHaveBeenCalledWith(createdUser);
            expect(result).toEqual(publicUser);
        });

        it("should throw ConflictException", async () => {
            const dto: CreateUserDto = { email: "joao@email.com", name: "Joao", password: "12345678" };

            vi.spyOn(userService, "assertEmailIsAvailable").mockRejectedValue(new ConflictException());

            await expect(userService.create(dto)).rejects.toThrow(ConflictException);

            expect(userService.assertEmailIsAvailable).toHaveBeenCalledWith(dto.email);
            expect(userRepository.save).not.toHaveBeenCalled();
            expect(userMapper.toPublicUserDto).not.toHaveBeenCalled();
        });
    });

    describe("findAll", () => {
        it("should return all users", async () => {
            const users = [userFactory(), userFactory(), userFactory()];
            const publicDtoFn = (u: User) => ({ id: u.id }) as PublicUserDto;

            vi.spyOn(userRepository, "findByNameStartsWith").mockResolvedValue(users);
            vi.spyOn(userMapper, "toPublicUserDto").mockImplementation(publicDtoFn);

            const result = await userService.findAll();

            expect(userRepository.findByNameStartsWith).toHaveBeenCalledWith(undefined);
            expect(userMapper.toPublicUserDto).toHaveBeenCalledTimes(users.length);
            expect(result).toEqual(users.map(publicDtoFn));
        });

        it("should return all users with names starting with the provided name", async () => {
            const users = [userFactory({ name: "Joao" }), userFactory({ name: "Joana" })];
            const publicDtoFn = (u: User) => ({ id: u.id }) as PublicUserDto;

            vi.spyOn(userRepository, "findByNameStartsWith").mockResolvedValue(users);
            vi.spyOn(userMapper, "toPublicUserDto").mockImplementation(publicDtoFn);

            const result = await userService.findAll("Jo");

            expect(userRepository.findByNameStartsWith).toHaveBeenCalledWith("Jo");
            expect(userMapper.toPublicUserDto).toHaveBeenCalledTimes(users.length);
            expect(result).toEqual(users.map(publicDtoFn));
        });
    });

    describe("remove", () => {
        it("should remove a user", async () => {
            const id = "uuid";
            const user = userFactory({ id });

            vi.spyOn(userRepository, "get").mockResolvedValue(user);
            vi.spyOn(userRepository, "softRemove").mockResolvedValue({ ...user, removedAt: new Date() });

            const result = await userService.remove(id);

            expect(userRepository.get).toHaveBeenCalledWith(id);
            expect(userRepository.softRemove).toHaveBeenCalledWith(id);
            expect(result).toBeUndefined();
        });

        it("should throw NotFoundException", async () => {
            const id = "uuid";

            vi.spyOn(userRepository, "get").mockResolvedValue(null);

            await expect(userService.remove(id)).rejects.toThrow(NotFoundException);

            expect(userRepository.get).toHaveBeenCalledWith(id);
            expect(userRepository.softRemove).not.toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("should update and return a user", async () => {
            const id = "uuid";
            const dto: UpdateUserDto = { email: "new@email.com", name: "New Name" };
            const foundUser = userFactory({ id, email: dto.email });
            const updatedUser = { ...foundUser, ...dto };

            vi.spyOn(userRepository, "get").mockResolvedValue(foundUser);
            vi.spyOn(userRepository, "patch").mockResolvedValue(updatedUser);
            vi.spyOn(userService, "assertEmailIsAvailable").mockResolvedValue(undefined);
            vi.spyOn(userMapper, "toPublicUserDto").mockResolvedValue({ id } as PublicUserDto);

            const result = await userService.update(id, dto);

            expect(userRepository.get).toHaveBeenCalledWith(id);
            expect(userService.assertEmailIsAvailable).not.toHaveBeenCalled();
            expect(userRepository.patch).toHaveBeenCalledWith(id, dto);
            expect(userMapper.toPublicUserDto).toHaveBeenCalledWith(updatedUser);
            expect(result).toEqual({ id });
        });

        it("should not throw ConflictException", async () => {
            const id = "uuid";
            const dto: UpdateUserDto = { email: "new@email.com", name: "New Name" };
            const foundUser = userFactory({ id });
            const updatedUser = { ...foundUser, ...dto };

            vi.spyOn(userRepository, "get").mockResolvedValue(foundUser);
            vi.spyOn(userRepository, "patch").mockResolvedValue(updatedUser);
            vi.spyOn(userService, "assertEmailIsAvailable").mockResolvedValue(undefined);
            vi.spyOn(userMapper, "toPublicUserDto").mockResolvedValue({ id } as PublicUserDto);

            const result = await userService.update(id, dto);

            expect(userRepository.get).toHaveBeenCalledWith(id);
            expect(userService.assertEmailIsAvailable).toHaveBeenCalledWith(dto.email);
            expect(userRepository.patch).toHaveBeenCalledWith(id, dto);
            expect(userMapper.toPublicUserDto).toHaveBeenCalledWith(updatedUser);
            expect(result).toEqual({ id });
        });

        it("should throw ConflictException", async () => {
            const id = "uuid";
            const dto: UpdateUserDto = { email: "new@email.com", name: "New Name" };
            const foundUser = userFactory({ id });
            const updatedUser = { ...foundUser, ...dto };

            vi.spyOn(userRepository, "get").mockResolvedValue(foundUser);
            vi.spyOn(userRepository, "patch").mockResolvedValue(updatedUser);
            vi.spyOn(userService, "assertEmailIsAvailable").mockRejectedValue(new ConflictException());
            vi.spyOn(userMapper, "toPublicUserDto").mockResolvedValue({ id } as PublicUserDto);

            await expect(userService.update(id, dto)).rejects.toThrow(ConflictException);

            expect(userRepository.get).toHaveBeenCalledWith(id);
            expect(userService.assertEmailIsAvailable).toHaveBeenCalledWith(dto.email);
            expect(userRepository.patch).not.toHaveBeenCalled();
            expect(userMapper.toPublicUserDto).not.toHaveBeenCalled();
        });

        it("should throw NotFoundException", async () => {
            const id = "uuid";
            const dto: UpdateUserDto = { email: "new@email.com" };

            vi.spyOn(userRepository, "get").mockResolvedValue(null);
            vi.spyOn(userService, "assertEmailIsAvailable").mockResolvedValue(undefined);

            await expect(userService.update(id, dto)).rejects.toThrow(NotFoundException);

            expect(userRepository.get).toHaveBeenCalledWith(id);
            expect(userService.assertEmailIsAvailable).not.toHaveBeenCalled();
            expect(userRepository.patch).not.toHaveBeenCalled();
            expect(userMapper.toPublicUserDto).not.toHaveBeenCalled();
        });
    });

    describe("assertExistsById", () => {
        it("should do nothing", async () => {
            const id = "uuid";

            vi.spyOn(userRepository, "has").mockResolvedValue(true);

            const result = await userService.assertExistsById(id);

            expect(userRepository.has).toHaveBeenCalledWith(id);
            expect(result).toBeUndefined();
        });

        it("should throw BadRequestException", async () => {
            const id = "uuid";

            vi.spyOn(userRepository, "has").mockResolvedValue(false);

            await expect(userService.assertExistsById(id)).rejects.toThrow(BadRequestException);

            expect(userRepository.has).toHaveBeenCalledWith(id);
        });
    });
});
