import { User } from "../../src/modules/user/entities/user.entity.js";

export default function (overrides?: Partial<User>): User {
    return {
        createdAt: new Date(),
        email: Date.now() + "-test@email.com",
        id: crypto.randomUUID(),
        name: "Test",
        password: "12345678",
        removedAt: null,
        updatedAt: new Date(),
        ...overrides,
    };
}
