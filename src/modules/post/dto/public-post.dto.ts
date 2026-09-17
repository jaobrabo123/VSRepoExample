import { PublicUserDto } from "../../user/dto/public-user.dto.js";

export class PublicPostDto {
    id: string;
    title: string;
    content: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    user: PublicUserDto;
    tags: string[];
}
