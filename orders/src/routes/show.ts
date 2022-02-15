import express, { Request, Response } from "express";
import {
  requireAuth,
  NotFoundError,
  NotAuthorizedError,
} from "@gsinghtickets/common";
import { Order } from "../models/order";
import { body } from "express-validator";

const showOrderRouter = express.Router();

showOrderRouter
  .route("/api/orders/:orderId")
  .get(
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

      // If all goes well, send user the order
      res.send(order);
    }
  );

export { showOrderRouter };
