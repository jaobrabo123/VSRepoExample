import { User } from "../../user/entities/user.entity.js";
import { Tag } from "./tag.entity.js";

export class Post {
    id: string;
    title: string;
    content: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    tags: Tag[];
}
