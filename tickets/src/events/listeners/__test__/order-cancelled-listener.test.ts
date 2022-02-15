import { Message } from "node-nats-streaming";
import { OrderCancelledEvent } from "@gsinghtickets/common";
import { Ticket } from "../../../models/ticket";
import { natsWrapper } from "../../../nats-wrapper";
import { generateTestId } from "../../../test/test-utils";
import { OrderCancelledListener } from "../order-cancelled-listener";

const setupTestListener = async () => {
  const listener = new OrderCancelledListener(natsWrapper.client);

  // Create & save a ticket
  const ticket = Ticket.build({
    title: "concert",
    price: 99,
    userId: "asdf",
  });
  const orderId = generateTestId();
  ticket.set({ orderId });
  await ticket.save();

  // MOCK DATA OBJECT
  const data: OrderCancelledEvent["data"] = {
    id: orderId,
    version: 0,
    ticket: {
      id: ticket.id,
    },
  };

  // Create a MOCK msg object that acknowledges the message
  // @ts-ignore - Tell TS to ignore all props on msg, except .ack()
  const msg: Message = {
    ack: jest.fn(), // Mock function
  };

  return { data, ticket, orderId, listener, msg };
};

describe("Listener: order cancelled", () => {
  it("updates the ticket", async () => {
    const { data, ticket, orderId, listener, msg } = await setupTestListener();

    await listener.onMessage(data, msg);
    const updatedTicket = await Ticket.findById(ticket.id);
    expect(updatedTicket!.orderId).toBeUndefined();
  });

  it("successfully publishes the event", async () => {
    const { data, ticket, orderId, listener, msg } = await setupTestListener();

    await listener.onMessage(data, msg);
    const updatedTicket = await Ticket.findById(ticket.id);
    expect(updatedTicket!.orderId).toBeUndefined();
    expect(natsWrapper.client.publish).toHaveBeenCalled();
  });

  it("successfully acknowledges the event", async () => {
    const { data, ticket, orderId, listener, msg } = await setupTestListener();

    await listener.onMessage(data, msg);
    const updatedTicket = await Ticket.findById(ticket.id);
    expect(updatedTicket!.orderId).toBeUndefined();
    expect(msg.ack).toHaveBeenCalled();
  });
});
