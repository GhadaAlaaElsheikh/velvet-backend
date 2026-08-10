import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";

import type{ Response } from "express";

import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { GoogleAuthGuard } from "./guards/google-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // Google handles the redirect
  }

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: any,
    @Res() res: Response,
  ) {
    const result =
      await this.authService.googleLogin(req.user);

    res.redirect(
      `http://localhost:3000/auth/google/callback#accessToken=${result.accessToken}&userId=${result.user.id}`,
    );
  }

  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}