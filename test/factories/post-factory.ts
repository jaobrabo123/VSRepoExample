import { Tag } from "../../src/generated/prisma/client.js";
import { Post } from "../../src/modules/post/entities/post.entity.js";
import { User } from "../../src/modules/user/entities/user.entity.js";

const toTagFn = (name: string, postId: string): Tag => ({
    id: crypto.randomUUID(),
    postId,
    name,
    createdAt: new Date(),
});

export default function (overrides?: Partial<Post>, tags?: string[]): Post {
    const postId = overrides?.id ?? crypto.randomUUID();

    return {
        id: postId,
        content: "Some post content",
        title: "Some post title",
        tags: (tags ?? ["dev", "typescript"]).map(tag => toTagFn(tag, postId)),
        userId: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {} as unknown as User,
        ...overrides,
    };
}
