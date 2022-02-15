import { Message } from "node-nats-streaming";
import { TicketUpdatedEvent } from "@gsinghtickets/common";
import { natsWrapper } from "../../../nats-wrapper";
import { generateNewTicket } from "../../../test/test-utils";
import { TicketUpdatedListener } from "../ticket-updated-listener";
import { Ticket } from "../../../models/ticket";

const setupTestListener = async () => {
  // Create a Listener
  const listener = new TicketUpdatedListener(natsWrapper.client);

  // Create & save a ticket
  const ticket = await generateNewTicket();

  // Create a fake data object that simulates the update event
  const data: TicketUpdatedEvent["data"] = {
    id: ticket.id,
    title: "updated title",
    price: 999,
    userId: "fakeuserid",
    version: ticket.version + 1,
  };

  // Create a fake msg object that acknowledges the message
  // @ts-ignore - Tell TS to ignore all props on msg, except .ack()
  const msg: Message = {
    ack: jest.fn(), // Mock function
  };

  // Return
  return { listener, data, msg, ticket };
};

describe("Listener: ticket updated", () => {
  it("should successfully find, update, and save a ticket", async () => {
    const { msg, data, ticket, listener } = await setupTestListener();

    await listener.onMessage(data, msg);

    const updatedTicket = await Ticket.findById(ticket.id);
    expect(updatedTicket!.title).toEqual(data.title);
    expect(updatedTicket!.price).toEqual(data.price);
    expect(updatedTicket!.version).toEqual(data.version);
  });

  it("successfully acknowledges the message", async () => {
    const { msg, data, listener } = await setupTestListener();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
  });

  it("does not acknowledge the event if incorrect version", async () => {
    const { msg, data, listener } = await setupTestListener();

    // Manually update the ticket version to
    // simulate an update
    data.version = 10;

    try {
      await listener.onMessage(data, msg);
    } catch (err) {}

    expect(msg.ack).not.toHaveBeenCalled();
  });
});
