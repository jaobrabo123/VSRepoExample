import { ArrayMaxSize, IsArray, IsNotEmpty, IsString, IsUUID, MaxLength } from "class-validator";

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    title: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    content: string;

    @IsUUID()
    userId: string;

    @IsArray()
    @ArrayMaxSize(20)
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    @MaxLength(30, { each: true })
    tags: string[];
}
