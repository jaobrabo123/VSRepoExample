import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;
}
