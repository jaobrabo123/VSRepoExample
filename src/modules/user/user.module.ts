import { Module } from "@nestjs/common";
import { UserController } from "./user.controller.js";
import { UserService } from "./user.service.js";
import { UserRepository } from "./user.repository.js";
import { PrismaModule } from "../../infra/prisma/prisma.module.js";
import { UserMapper } from "./user.mapper.js";

@Module({
    imports: [PrismaModule],
    controllers: [UserController],
    providers: [UserService, UserRepository, UserMapper],
})
export class UserModule {}
