import { Message } from "node-nats-streaming";
import { OrderCreatedEvent, OrderStatus } from "@gsinghtickets/common";
import { Ticket } from "../../../models/ticket";
import { natsWrapper } from "../../../nats-wrapper";
import { generateTestId } from "../../../test/test-utils";
import { OrderCreatedListener } from "../order-created-listener";

const setupTestListener = async () => {
  // Create an instance of the listener
  const listener = new OrderCreatedListener(natsWrapper.client);

  // Create & save a ticket
  const ticket = Ticket.build({
    title: "concert",
    price: 99,
    userId: "asdf",
  });
  await ticket.save();

  // MOCK data object
  const data: OrderCreatedEvent["data"] = {
    id: generateTestId(),
    version: 0,
    status: OrderStatus.Created,
    userId: "alskdfj",
    expiresAt: "alskdjf",
    ticket: {
      id: ticket.id,
      price: ticket.price,
    },
  };

  // Create a MOCK msg object that acknowledges the message
  // @ts-ignore - Tell TS to ignore all props on msg, except .ack()
  const msg: Message = {
    ack: jest.fn(), // Mock function
  };

  return { listener, ticket, data, msg };
};

describe("Listener: ", () => {
  it("correctly sets the userId of the ticket", async () => {
    const { listener, ticket, data, msg } = await setupTestListener();

    await listener.onMessage(data, msg);

    const updatedTicket = await Ticket.findById(ticket.id);
    expect(updatedTicket!.orderId).toEqual(data.id);
  });

  it("successfully acknowledges the message", async () => {
    const { listener, ticket, data, msg } = await setupTestListener();

    await listener.onMessage(data, msg);
    expect(msg.ack).toHaveBeenCalled();
  });

  it("sussfully publishes a ticket updated event", async () => {
    const { listener, ticket, data, msg } = await setupTestListener();

    await listener.onMessage(data, msg);

    expect(natsWrapper.client.publish).toHaveBeenCalled();

    const ticketUpdatedData = JSON.parse(
      (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
    );

    expect(data.id).toEqual(ticketUpdatedData.orderId);
  });
});
