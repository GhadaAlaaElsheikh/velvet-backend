import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";

import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("orders")
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  // Customer creates an order
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() body: CreateOrderDto,
    @Req() req: any,
  ) {
    return this.ordersService.create(
      body,
      req.user.userId,
    );
  }

  // Admin gets all orders
  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll() {
    return this.ordersService.findAll();
  }
  
    @Get("my-orders")
  @UseGuards(JwtAuthGuard)
  findByUser(
    @Req() req: any,
  ) {
    return this.ordersService.findByUser(req.user.userId);
  }
  // Authenticated user can get one order
  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findOne(@Param("id") id: string) {
    return this.ordersService.findOne(id);
  }

  // Admin changes order status
  @Patch(":id/:status")
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(
    @Param("id") id: string,
    @Param("status") status: string,
  ) {
    return this.ordersService.updateStatus(
      id,
      status,
    );
  }
 

  // Admin deletes order
  @Delete(":id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param("id") id: string) {
    return this.ordersService.remove(id);
  }
}