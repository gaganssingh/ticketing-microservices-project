import { NotFoundError } from "@gsinghtickets/common";
import express, { Request, Response } from "express";
import { Ticket } from "../models/ticket";

const showTicketRouter = express.Router();

showTicketRouter
  .route("/api/tickets/:id")
  .get(async (req: Request, res: Response) => {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      throw new NotFoundError();
    }

    res.status(200).send(ticket);
  });

export { showTicketRouter };
