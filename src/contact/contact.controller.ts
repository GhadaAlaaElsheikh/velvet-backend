import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from "@nestjs/common";
 import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { ContactService } from "./contact.service";
import { CreateContactDto } from "./dto/create-contact.dto";

@Controller("contacts")
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
  ) {}

  // أي شخص يقدر يرسل رسالة
  @Post()
  create(
    @Body() createContactDto: CreateContactDto,
  ) {
    return this.contactService.create(
      createContactDto,
    );
  }

  // Admin فقط يقدر يشوف الرسائل
  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll() {
    return this.contactService.findAll();
  }
}