import { Message } from "node-nats-streaming";
import { TicketCreatedEvent } from "@gsinghtickets/common";
import { Ticket } from "../../../models/ticket";
import { natsWrapper } from "../../../nats-wrapper";
import { generateTestId } from "../../../test/test-utils";
import { TicketCreatedListener } from "../ticket-created-listener";

const setupTestListener = async () => {
  // Create an instance of the listener
  const listener = new TicketCreatedListener(natsWrapper.client);

  // Create a fake data event
  const data: TicketCreatedEvent["data"] = {
    id: generateTestId(),
    title: "concert",
    price: 10,
    userId: generateTestId(),
    version: 0,
  };

  // Create a fake msg object that acknowledges the message
  // @ts-ignore - Tell TS to ignore all props on msg, except .ack()
  const msg: Message = {
    ack: jest.fn(), // Mock function
  };

  return { listener, data, msg };
};

describe("Listener: ticket created listener", () => {
  it("successfully creates & saves a ticket", async () => {
    const { listener, data, msg } = await setupTestListener();

    // call the onMessage function with the data & msg objects
    await listener.onMessage(data, msg);

    const ticket = await Ticket.findById(data.id);

    // write test assertions
    expect(ticket).toBeDefined();
    expect(ticket!.title).toEqual(data.title);
    expect(ticket!.price).toEqual(data.price);
  });

  it("successfully acknowledges the message", async () => {
    const { listener, data, msg } = await setupTestListener();

    // call the onMessage function with the data & msg objects
    await listener.onMessage(data, msg);

    // Assertions to ensure the msg.ack() was called
    expect(msg.ack).toHaveBeenCalled();
  });
});
