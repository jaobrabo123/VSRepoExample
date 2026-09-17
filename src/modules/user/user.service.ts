import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRepository } from "./user.repository.js";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { UpdateUserDto } from "./dto/update-user.dto.js";
import { UserMapper } from "./user.mapper.js";
import { PublicUserDto } from "./dto/public-user.dto.js";

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly userMapper: UserMapper,
    ) {}

    private asserExists<T>(user: T): asserts user is NonNullable<T> {
        if (!user) {
            throw new NotFoundException("User not found");
        }
    }

    private async assertEmailIsAvailable(email: string) {
        const emailExists = await this.userRepository.existsByEmail(email, { see: "all" });
        if (emailExists) {
            throw new ConflictException("Email unavailable");
        }
    }

    async create(dto: CreateUserDto): Promise<PublicUserDto> {
        await this.assertEmailIsAvailable(dto.email);

        const newUser = await this.userRepository.save(dto);

        return this.userMapper.toPublicUserDto(newUser);
    }

    async findAll(name?: string): Promise<PublicUserDto[]> {
        const users = await this.userRepository.findByNameStartsWith(name);
        return users.map(u => this.userMapper.toPublicUserDto(u));
    }

    async findOne(id: string): Promise<PublicUserDto> {
        const user = await this.userRepository.get(id);
        this.asserExists(user);

        return this.userMapper.toPublicUserDto(user);
    }

    async update(id: string, dto: UpdateUserDto): Promise<PublicUserDto> {
        const user = await this.userRepository.get(id);
        this.asserExists(user);

        if (dto.email && user.email !== dto.email) {
            await this.assertEmailIsAvailable(dto.email);
        }

        const updatedUser = await this.userRepository.patch(id, dto);
        return this.userMapper.toPublicUserDto(updatedUser);
    }

    async remove(id: string): Promise<void> {
        const user = await this.userRepository.get(id);
        this.asserExists(user);

        await this.userRepository.softRemove(id);
    }
}
