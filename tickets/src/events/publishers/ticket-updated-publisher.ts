import { Publisher, Subjects, TicketUpdatedEvent } from "@gsinghtickets/common";

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
}
