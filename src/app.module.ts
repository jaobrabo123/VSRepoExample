import { Module, UnprocessableEntityException, ValidationPipe } from "@nestjs/common";
import { UserModule } from "./modules/user/user.module.js";
import { PrismaModule } from "./infra/prisma/prisma.module.js";
import { ConfigModule } from "@nestjs/config";
import appConfig from "./config/app.config.js";
import { APP_PIPE } from "@nestjs/core";
import { PostModule } from "./modules/post/post.module.js";

@Module({
    imports: [UserModule, PrismaModule, ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }), PostModule],
    providers: [
        {
            provide: APP_PIPE,
            useValue: new ValidationPipe({
                whitelist: true,
                transform: true,
                forbidNonWhitelisted: true,
                exceptionFactory: errors => new UnprocessableEntityException(errors),
            }),
        },
    ],
})
export class AppModule {}
