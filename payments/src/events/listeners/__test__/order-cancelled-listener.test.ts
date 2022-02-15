import { OrderCancelledEvent, OrderStatus } from "@gsinghtickets/common";
import { Message } from "node-nats-streaming";
import { Order } from "../../../models/order";
import { natsWrapper } from "../../../nats-wrapper";
import { generateTestId } from "../../../test/test-utils";
import { OrderCancelledListener } from "../order-cancelled-listener";

const setup = async () => {
  const listener = new OrderCancelledListener(natsWrapper.client);

  const order = Order.build({
    id: generateTestId(),
    status: OrderStatus.Created,
    price: 10,
    userId: "test",
    version: 0,
  });
  await order.save();

  const data: OrderCancelledEvent["data"] = {
    id: order.id,
    version: order.version + 1,
    ticket: {
      id: "test",
    },
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, order, data, msg };
};

describe("Listener: order cancelled", () => {
  it("successfully updates the status of the order", async () => {
    const { listener, order, data, msg } = await setup();
    await listener.onMessage(data, msg);

    const orderToCheck = await Order.findById(order.id);

    expect(orderToCheck!.status).toEqual(OrderStatus.Cancelled);
  });

  it("successfully acknowledges the message", async () => {
    const { listener, data, msg } = await setup();
    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
  });
});
