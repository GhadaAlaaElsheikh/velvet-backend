import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
constructor(
  @InjectModel(User.name)
  private readonly userModel: Model<User>,
  private readonly jwtService: JwtService,
) {}

 async register(body: RegisterDto) {
  const userExist = await this.userModel.findOne({
    email: body.email,
  });

  if (userExist) {
    throw new ConflictException('Email already exists');
  }
if (body.password !== body.confirmPassword) {
  throw new BadRequestException(
    'Passwords do not match',
  );
}
  const hashedPassword = await bcrypt.hash(body.password, 10);

  const user = await this.userModel.create({
    ...body,
    password: hashedPassword,
  });

  return {
    message: 'User created successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
}
async login(body: LoginDto) {
  const user = await this.userModel.findOne({
    email: body.email,
  });

  if (!user) {
    throw new UnauthorizedException('Invalid email or password');
  }

  const isMatched = await bcrypt.compare(
    body.password,
    user.password,
  );

  if (!isMatched) {
    throw new UnauthorizedException('Invalid email or password');
  }

  const accessToken = await this.jwtService.signAsync({
    sub: user._id,
    email: user.email,
    role: user.role
  });

return {
  message: 'Login successfully',
  accessToken,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role:user.role
  },
};
}
async googleLogin(profile: {
  googleId: string;
  email: string;
  name: string;
}) {
  let user = await this.userModel.findOne({
    email: profile.email,
  });

  // User doesn't exist → create account
  if (!user) {
    // Google users don't have a normal password
    const randomPassword = await bcrypt.hash(
      Math.random().toString(36) + Date.now(),
      10,
    );

    user = await this.userModel.create({
      name: profile.name,
      email: profile.email,
      password: randomPassword,
      googleId: profile.googleId,
    });
  }

  // Generate JWT exactly like normal login
  const accessToken = await this.jwtService.signAsync({
    sub: user._id,
    email: user.email,
    role: user.role,
  });

  return {
    message: "Google login successfully",
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
}