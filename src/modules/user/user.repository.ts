import { Injectable } from "@nestjs/common";
import { VSRepoPrisma7Adapter } from "@vsrepo/prisma7-adapter";
import { DynamicMethod, MethodOptions, VSLogLevel, VSRepository } from "vsrepo";
import { User } from "./entities/user.entity.js";
import { MyOrmTypes } from "../../common/types/my-orm-types.type.js";
import { PrismaService } from "../../infra/prisma/prisma.service.js";

@Injectable()
export class UserRepository extends VSRepository<User, string, MyOrmTypes> {
    constructor(prisma: PrismaService) {
        super({
            adapter: new VSRepoPrisma7Adapter(prisma, {
                pkName: "id",
                tableName: "user",
                logLevel: VSLogLevel.INFO,
            }),
            pkName: "id",
            logLevel: VSLogLevel.INFO,
            softRemoveKey: "removedAt",
        });
    }

    @DynamicMethod()
    declare existsByEmail: (email: string, options?: MethodOptions<User>) => Promise<boolean>;

    @DynamicMethod()
    declare findByNameStartsWith: (name?: string, options?: MethodOptions<User>) => Promise<User[]>;
}
