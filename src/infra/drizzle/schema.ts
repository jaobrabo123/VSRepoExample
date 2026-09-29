import { sqliteTable, uniqueIndex, text, integer } from "drizzle-orm/sqlite-core";

export const timestamps = {
    createdAt: integer({ mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: integer({ mode: "timestamp" })
        .$defaultFn(() => new Date())
        .$onUpdateFn(() => new Date())
        .notNull(),
};

export const user = sqliteTable(
    "User",
    {
        id: text()
            .primaryKey()
            .$default(() => crypto.randomUUID()),
        name: text().notNull(),
        email: text().notNull(),
        password: text().notNull(),
        removedAt: integer({ mode: "timestamp" }),
        ...timestamps,
    },
    table => [uniqueIndex("User_email_key").on(table.email)],
);

export const post = sqliteTable("Post", {
    id: text()
        .primaryKey()
        .$default(() => crypto.randomUUID()),
    title: text().notNull(),
    content: text().notNull(),
    userId: text()
        .notNull()
        .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    ...timestamps,
});

export const tag = sqliteTable(
    "Tag",
    {
        id: text()
            .primaryKey()
            .$default(() => crypto.randomUUID()),
        name: text().notNull(),
        postId: text()
            .notNull()
            .references(() => post.id, { onDelete: "cascade", onUpdate: "cascade" }),
        createdAt: timestamps.createdAt,
    },
    table => [uniqueIndex("Tag_postId_name_key").on(table.postId, table.name)],
);
