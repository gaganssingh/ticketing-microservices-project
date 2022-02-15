import {
  Publisher,
  OrderCancelledEvent,
  Subjects,
} from "@gsinghtickets/common";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
}
