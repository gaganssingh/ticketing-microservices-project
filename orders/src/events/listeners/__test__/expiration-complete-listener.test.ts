import { ExpirationCompleteEvent } from "@gsinghtickets/common";
import { Order, OrderStatus } from "../../../models/order";
import { natsWrapper } from "../../../nats-wrapper";
import { generateNewTicket } from "../../../test/test-utils";
import { ExpirationCompleteListener } from "../expiration-complete-listener";

const setupTestListener = async () => {
  const listener = new ExpirationCompleteListener(natsWrapper.client);

  // Create & save a ticket
  const ticket = await generateNewTicket();

  // Create & save a new order
  const order = Order.build({
    status: OrderStatus.Created,
    userId: "testuserid",
    expiresAt: new Date(),
    ticket,
  });
  await order.save();

  // Create a fake data object that simulates the update event
  const data: ExpirationCompleteEvent["data"] = {
    orderId: order.id,
  };

  // Create a fake msg object that acknowledges the message
  // @ts-ignore - Tell TS to ignore all props on msg, except .ack()
  const msg: Message = {
    ack: jest.fn(), // Mock function
  };

  return { listener, ticket, order, data, msg };
};

describe("Listener: expiration complete", () => {
  it("successfully updates order status to cancelled", async () => {
    const { listener, order, data, msg } = await setupTestListener();

    await listener.onMessage(data, msg);

    const updatedOrder = await Order.findById(order.id);
    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
  });

  it("successfully emit an order cancelled event", async () => {
    const { listener, order, data, msg } = await setupTestListener();

    await listener.onMessage(data, msg);

    expect(natsWrapper.client.publish).toHaveBeenCalled();

    const eventData = JSON.parse(
      (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
    );
    expect(eventData.id).toEqual(order.id);
  });

  it("successfully acknowledges the message", async () => {
    const { listener, data, msg } = await setupTestListener();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
  });
});
