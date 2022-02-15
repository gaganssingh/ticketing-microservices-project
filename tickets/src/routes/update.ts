import express, { Request, Response } from "express";
import { body } from "express-validator";
import {
  requireAuth,
  validateRequest,
  NotFoundError,
  NotAuthorizedError,
  BadRequestError,
} from "@gsinghtickets/common";
import { Ticket } from "../models/ticket";
import { natsWrapper } from "../nats-wrapper";
import { TicketUpdatedPublisher } from "../events/publishers/ticket-updated-publisher";

const updateTicketRouter = express.Router();

updateTicketRouter
  .route("/api/tickets/:id")
  .put(
    requireAuth,
    [
      body("title")
        .not()
        .isEmpty()
        .withMessage("Please provide a valid title."),
      body("price")
        .isFloat({ gt: 0 })
        .withMessage("Ticket price must be greater than $0."),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      const ticket = await Ticket.findById(req.params.id);

      if (!ticket) {
        throw new NotFoundError();
      }

      if (ticket.orderId) {
        throw new BadRequestError("Cannot edit a reserved ticket");
      }

      if (ticket.userId !== req.currentUser!.id) {
        throw new NotAuthorizedError();
      }

      const { title, price } = req.body;
      ticket.set({
        title: req.body.title,
        price: req.body.price,
      });

      await ticket.save();

      // Publish ticket update event to
      // the NATS streaming service
      new TicketUpdatedPublisher(natsWrapper.client).publish({
        id: ticket.id,
        title: ticket.title,
        price: ticket.price,
        userId: ticket.userId,
        version: ticket.version,
      });

      res.status(200).send(ticket);
    }
  );

export { updateTicketRouter };
