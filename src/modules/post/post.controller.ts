import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from "@nestjs/common";
import { PostService } from "./post.service.js";
import { CreatePostDto } from "./dto/create-post.dto.js";
import { UpdatePostDto } from "./dto/update-post.dto.js";
import { PublicPostDto } from "./dto/public-post.dto.js";

@Controller("post")
export class PostController {
    constructor(private readonly postService: PostService) {}

    @Post()
    create(@Body() createPostDto: CreatePostDto): Promise<PublicPostDto> {
        return this.postService.create(createPostDto);
    }

    @Get()
    findAll(@Query("userId", ParseUUIDPipe) userId?: string, @Query("title") title?: string) {
        return this.postService.findAll(userId, title);
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string): Promise<PublicPostDto> {
        return this.postService.findOne(id);
    }

    @Patch(":id")
    update(@Param("id", ParseUUIDPipe) id: string, @Body() updatePostDto: UpdatePostDto): Promise<PublicPostDto> {
        return this.postService.update(id, updatePostDto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
        return this.postService.remove(id);
    }
}
