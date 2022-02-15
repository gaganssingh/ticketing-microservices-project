import {
  PaymentCreatedEvent,
  Publisher,
  Subjects,
} from "@gsinghtickets/common";

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
}
