import express, { Request, Response } from "express";
import {
  requireAuth,
  NotFoundError,
  NotAuthorizedError,
} from "@gsinghtickets/common";
import { body } from "express-validator";
import { Order, OrderStatus } from "../models/order";
import { OrderCancelledPublisher } from "../events/publishers/order-cancelled-published";
import { natsWrapper } from "../nats-wrapper";

const deleteOrderRouter = express.Router();

deleteOrderRouter
  .route("/api/orders/:orderId")
  .delete(
    requireAuth,
    [
      body("orderId")
        .not()
        .isEmpty()
        .withMessage("Please provide a valid order id."),
    ],
    async (req: Request, res: Response) => {
      const order = await Order.findById(req.params.orderId).populate("ticket");

      // If order not found
      if (!order) {
        throw new NotFoundError();
      }

      // Check if user is authorized
      if (order.userId !== req.currentUser!.id) {
        throw new NotAuthorizedError();
      }

      // If all goes well, flip the status of the Order to cancelled
      // and save it back to db
      order.status = OrderStatus.Cancelled;
      await order.save();

      // Publish a "order:cancelled" event/message upon order creation
      new OrderCancelledPublisher(natsWrapper.client).publish({
        id: order.id,
        version: order.version,
        ticket: {
          id: order.ticket.id,
        },
      });

      res.status(204).send(order);
    }
  );

export { deleteOrderRouter };
