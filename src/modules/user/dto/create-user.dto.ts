import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, MaxLength } from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name: string;

    @IsEmail()
    email: string;

    @IsStrongPassword()
    password: string;
}
