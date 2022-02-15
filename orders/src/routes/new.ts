import express, { Request, Response } from "express";
import mongoose from "mongoose";
import {
  BadRequestError,
  NotFoundError,
  OrderStatus,
  requireAuth,
  validateRequest,
} from "@gsinghtickets/common";
import { body } from "express-validator";
import { Ticket } from "../models/ticket";
import { Order } from "../models/order";
import { OrderCreatedPublisher } from "../events/publishers/order-created-publisher";
import { natsWrapper } from "../nats-wrapper";

const newOrderRouter = express.Router();

const EXPIRATION_WINDOW_SECONDS = 1 * 60;

newOrderRouter.route("/api/orders").post(
  requireAuth,
  [
    body("ticketId")
      .not()
      .isEmpty()
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))

      .withMessage("Please provide a ticket id."),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    // Find ticket in the db
    const { ticketId } = req.body;
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError();
    }

    // Ensure the ticket isn't already reserved
    const isReserved = await ticket.isReserved();
    if (isReserved) {
      throw new BadRequestError("Ticket already reserved.");
    }

    // Set expiration date for this order
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + EXPIRATION_WINDOW_SECONDS);

    // Build the order & save to db
    const order = Order.build({
      userId: req.currentUser!.id,
      status: OrderStatus.Created,
      expiresAt,
      ticket,
    });
    await order.save();

    // Publish a "order:created" event/message upon order creation
    new OrderCreatedPublisher(natsWrapper.client).publish({
      id: order.id,
      status: OrderStatus.Created,
      userId: order.userId,
      expiresAt: order.expiresAt.toISOString(),
      version: order.version,
      ticket: {
        id: ticket.id,
        price: ticket.price,
      },
    });

    res.status(201).send(order);
  }
);

export { newOrderRouter };
