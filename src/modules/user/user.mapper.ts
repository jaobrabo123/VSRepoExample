import { Injectable } from "@nestjs/common";
import { User } from "./entities/user.entity.js";
import { PublicUserDto } from "./dto/public-user.dto.js";

@Injectable()
export class UserMapper {
    toPublicUserDto(user: User): PublicUserDto {
        return {
            createdAt: user.createdAt,
            id: user.id,
            email: user.email,
            name: user.name,
            updatedAt: user.updatedAt,
        };
    }
}
