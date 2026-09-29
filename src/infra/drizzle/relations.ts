import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.js";

export const relations = defineRelations(schema, r => ({
    post: {
        user: r.one.user({
            from: r.post.userId,
            to: r.user.id,
        }),
        tags: r.many.tag(),
    },
    user: {
        posts: r.many.post(),
    },
    tag: {
        post: r.one.post({
            from: r.tag.postId,
            to: r.post.id,
        }),
    },
}));
