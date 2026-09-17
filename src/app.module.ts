import { Module, ValidationPipe } from "@nestjs/common";
import { UserModule } from "./modules/user/user.module.js";
import { PrismaModule } from "./infra/prisma/prisma.module.js";
import { ConfigModule } from "@nestjs/config";
import appConfig from "./config/app.config.js";
import { APP_PIPE } from "@nestjs/core";

@Module({
    imports: [UserModule, PrismaModule, ConfigModule.forRoot({ isGlobal: true, load: [appConfig] })],
    providers: [
        {
            provide: APP_PIPE,
            useValue: new ValidationPipe({
                whitelist: true,
                transform: true,
                forbidNonWhitelisted: true,
            }),
        },
    ],
})
export class AppModule {}
