import { Message } from "node-nats-streaming";
import { Subjects, Listener, TicketUpdatedEvent } from "@gsinghtickets/common";
import { Ticket } from "../../models/ticket";
import { queueGroupName } from "./queue-group-name";

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
  queueGroupName: string = queueGroupName;

  async onMessage(data: TicketUpdatedEvent["data"], msg: Message) {
    const { title, price } = data;
    const ticket = await Ticket.findByPreviousVersion(data); // .findByPreviousVersion defined in the ticket model

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // Update & save ticket into
    // the Orders db
    ticket.set({ title, price });
    await ticket.save();

    // Manually acknowledge to the nats-streaming-server
    // that we have successfully processes this event
    msg.ack();
  }
}
