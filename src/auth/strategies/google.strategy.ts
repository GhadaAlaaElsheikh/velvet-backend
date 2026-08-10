import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Strategy } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy,
  "google",
) {
  constructor(
  private readonly configService: ConfigService,
) {
  console.log("GOOGLE CLIENT ID:", 
    configService.get<string>("GOOGLE_CLIENT_ID")
  );

  console.log("GOOGLE CALLBACK URL:",
    configService.get<string>("GOOGLE_CALLBACK_URL")
  );

super({
  clientID: configService.get<string>(
    "GOOGLE_CLIENT_ID",
  ) as string,

  clientSecret: configService.get<string>(
    "GOOGLE_CLIENT_SECRET",
  ) as string,

  callbackURL: "http://localhost:3001/auth/google/callback",

  scope: ["email", "profile"],
});
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    const { id, name, emails } = profile;

    return {
      googleId: id,
      email: emails?.[0]?.value,
      name: `${name?.givenName ?? ""} ${
        name?.familyName ?? ""
      }`.trim(),
    };
  }
}