import { requireAuth } from "@gsinghtickets/common";
import express, { Request, Response } from "express";
import { Order } from "../models/order";

const indexOrderRouter = express.Router();

indexOrderRouter
  .route("/api/orders")
  .get(requireAuth, async (req: Request, res: Response) => {
    // Get all orders by userId
    const orders = await Order.find({
      userId: req.currentUser!.id,
    })
      // also populate the orders with all tickets in the user's orders
      .populate("ticket");

    res.send(orders);
  });

export { indexOrderRouter };
