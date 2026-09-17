import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
    Query,
    ParseUUIDPipe,
} from "@nestjs/common";
import { UserService } from "./user.service.js";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { User } from "./entities/user.entity.js";
import { UpdateUserDto } from "./dto/update-user.dto.js";

@Controller("users")
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    create(@Body() dto: CreateUserDto): Promise<User> {
        return this.userService.create(dto);
    }

    @Get()
    findAll(@Query("name") name?: string): Promise<User[]> {
        return this.userService.findAll(name);
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string): Promise<User> {
        return this.userService.findOne(id);
    }

    @Patch(":id")
    update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto): Promise<User> {
        return this.userService.update(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
        return this.userService.remove(id);
    }
}
