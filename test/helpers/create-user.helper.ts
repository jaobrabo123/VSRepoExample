import { HttpStatus, INestApplication } from "@nestjs/common";
import { User } from "../../src/modules/user/entities/user.entity.js";
import { PublicUserDto } from "../../src/modules/user/dto/public-user.dto.js";
import userFactory from "../factories/user.factory.js";
import request from "supertest";

export default async function (app: INestApplication, overrides?: Partial<User>): Promise<PublicUserDto> {
    const user = userFactory({ ...overrides, password: overrides?.password ?? "!Str0ngPassword" });

    const response = await request(app.getHttpServer())
        .post("/users")
        .send({ name: user.name, email: user.email, password: user.password })
        .expect(HttpStatus.CREATED);

    return response.body;
}
