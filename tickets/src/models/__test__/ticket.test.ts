import { generateNewTicket } from "../../test/test-utils";
import { Ticket } from "../ticket";

describe("Model: ticket", () => {
  it("properly implements Optimistic Concurrency Control", async () => {
    // Create new test ticket & save to db
    const ticket = Ticket.build({
      title: "test",
      price: 5,
      userId: "123",
    });
    await ticket.save();

    // Fetch this test ticket from db
    const firstInstance = await Ticket.findById(ticket.id);
    const secondInstance = await Ticket.findById(ticket.id);

    // make two changes to the fetched test ticket
    firstInstance!.set({ price: 10 });
    secondInstance!.set({ price: 15 });

    // save the first test ticket, expect  it to be successful
    // as it has a ticket version number of 1
    await firstInstance!.save();

    // save the second test ticket, and expect an error
    // as the firstInstance!.save() incremented the version number
    // and the OCC implementation is still expecting version === 0
    try {
      await secondInstance!.save();
    } catch (err) {
      return;
    }
  });

  it("successfully increments the ticket's version number", async () => {
    // Create new test ticket & save to db
    const ticket = Ticket.build({
      title: "test",
      price: 5,
      userId: "123",
    });
    await ticket.save();
    expect(ticket.version).toEqual(0);

    // Update the ticket twice
    ticket.set({ price: 10 });
    await ticket.save();
    expect(ticket.version).toEqual(1);

    ticket.set({ price: 15 });
    await ticket.save();
    expect(ticket.version).toEqual(2);
  });
});
