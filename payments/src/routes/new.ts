import {
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
  OrderStatus,
  requireAuth,
  validateRequest,
} from "@gsinghtickets/common";
import express, { Request, Response } from "express";
import { body } from "express-validator";
import { PaymentCreatedPublisher } from "../events/publishers/payment-created-publisher";
import { Order } from "../models/order";
import { Payment } from "../models/payment";
import { natsWrapper } from "../nats-wrapper";
import { stripe } from "../stripe";

const createChargeRouter = express.Router();

createChargeRouter
  .route("/api/payments")
  .post(
    requireAuth,
    [
      body("token").not().isEmpty().withMessage("Missing token"),
      body("orderId").not().isEmpty().withMessage("Missing orderId"),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      const { token, orderId } = req.body;

      // Find the order from the db
      const order = await Order.findById(orderId);
      if (!order) {
        throw new NotFoundError();
      }

      if (req.currentUser!.id !== order.userId) {
        throw new NotAuthorizedError();
      }

      if (order.status === OrderStatus.Cancelled) {
        throw new BadRequestError("Cannot process a cancelled order");
      }

      // INVOKE STRIPE TO CHARGE CUSTOMER
      const charge = await stripe.charges.create({
        currency: "usd",
        amount: order.price * 100,
        source: token,
      });

      // Build and save payment details in db
      const payment = Payment.build({
        orderId,
        stripeId: charge.id,
      });
      await payment.save();

      new PaymentCreatedPublisher(natsWrapper.client).publish({
        id: payment.id,
        orderId: payment.orderId,
        stripeId: payment.stripeId,
      });

      res.status(201).send({ id: payment.id });
    }
  );

export { createChargeRouter };
