import {
  ExpirationCompleteEvent,
  Listener,
  OrderStatus,
  Subjects,
} from "@gsinghtickets/common";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order";
import { natsWrapper } from "../../nats-wrapper";
import { OrderCancelledPublisher } from "../publishers/order-cancelled-published";
import { queueGroupName } from "./queue-group-name";

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
  queueGroupName: string = queueGroupName;

  async onMessage(data: ExpirationCompleteEvent["data"], msg: Message) {
    // Find order in the db
    const order = await Order.findById(data.orderId).populate("ticket");
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === OrderStatus.Complete) {
      return msg.ack();
    }

    // Set order's status to cancelled
    order.set({
      status: OrderStatus.Cancelled,
    });

    // Save the order
    await order.save();

    // Publish an event/message
    // saying the order has been cancelled
    await new OrderCancelledPublisher(natsWrapper.client).publish({
      id: order.id,
      version: order.version,
      ticket: {
        id: order.ticket.id,
      },
    });

    // Manually acknowledge the message
    msg.ack();
  }
}
