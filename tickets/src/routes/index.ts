import express, { Request, Response } from "express";
import { Ticket } from "../models/ticket";

const indexTicketRouter = express.Router();

indexTicketRouter
  .route("/api/tickets")
  .get(async (req: Request, res: Response) => {
    const tickets = await Ticket.find({
      orderId: undefined, // Find only the tickets that have not been reserved
    });

    res.status(200).send(tickets);
  });

export { indexTicketRouter };
