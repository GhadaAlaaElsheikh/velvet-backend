import { IsEmail, IsNotEmpty, IsString, minLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;


  @MinLength(6)
  confirmPassword: string;
}