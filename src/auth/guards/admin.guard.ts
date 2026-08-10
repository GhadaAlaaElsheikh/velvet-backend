import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    console.log("REQUEST USER:", request.user);

    if (!request.user) {
      throw new ForbiddenException(
        "User not authenticated",
      );
    }

    if (request.user.role !== "admin") {
      throw new ForbiddenException(
        "Admin access only",
      );
    }

    return true;
  }
}