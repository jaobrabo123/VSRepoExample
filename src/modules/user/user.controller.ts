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
import { UpdateUserDto } from "./dto/update-user.dto.js";
import { PublicUserDto } from "./dto/public-user.dto.js";

@Controller("users")
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    create(@Body() dto: CreateUserDto): Promise<PublicUserDto> {
        return this.userService.create(dto);
    }

    @Get()
    findAll(@Query("name") name?: string): Promise<PublicUserDto[]> {
        return this.userService.findAll(name);
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string): Promise<PublicUserDto> {
        return this.userService.findOne(id);
    }

    @Patch(":id")
    update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto): Promise<PublicUserDto> {
        return this.userService.update(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
        return this.userService.remove(id);
    }
}
