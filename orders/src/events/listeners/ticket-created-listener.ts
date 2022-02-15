import { Subjects, Listener, TicketCreatedEvent } from "@gsinghtickets/common";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../models/ticket";
import { queueGroupName } from "./queue-group-name";

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
  queueGroupName: string = queueGroupName;

  async onMessage(data: TicketCreatedEvent["data"], msg: Message) {
    const { id, title, price } = data;

    // Build and save ticket inside the Orders db
    const ticket = Ticket.build({
      id,
      title,
      price,
    });
    await ticket.save();

    // Manually acknowledge to the nats-streaming-server
    // that we have successfully processes this event
    msg.ack();
  }
}
