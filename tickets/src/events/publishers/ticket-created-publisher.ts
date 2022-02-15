import { Publisher, Subjects, TicketCreatedEvent } from "@gsinghtickets/common";

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
}
