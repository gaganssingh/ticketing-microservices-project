import request from "supertest";
import { app } from "../../app";
import {
  generateTestCookie,
  ordersRoute,
  generateNewTicket,
} from "../../test/test-utils";

describe("Route: index order", () => {
  it("successfully fetches all orders for the user that made the request", async () => {
    // Create three tickets
    const ticketOne = await generateNewTicket();
    const ticketTwo = await generateNewTicket();
    const ticketThree = await generateNewTicket();

    // Create one order for user 1
    const userOne = await generateTestCookie();
    await request(app)
      .post(ordersRoute)
      .set("Cookie", userOne)
      .send({ ticketId: ticketOne.id }) // reserve first ticket
      .expect(201);

    // Create two orders for user 2
    const userTwo = await generateTestCookie();
    const { body: orderOne } = await request(app)
      .post(ordersRoute)
      .set("Cookie", userTwo)
      .send({ ticketId: ticketTwo.id }) // reserve second ticket
      .expect(201);
    const { body: orderTwo } = await request(app)
      .post(ordersRoute)
      .set("Cookie", userTwo)
      .send({ ticketId: ticketThree.id }) // reserve third ticket
      .expect(201);

    // Make request user 2's orders
    const orders = await request(app)
      .get(ordersRoute)
      .set("Cookie", userTwo)
      .expect(200);

    // Ensure only User 2's orders are fetched
    expect(orders.body.length).toEqual(2);
    expect(orders.body[0].id).toEqual(orderOne.id);
    expect(orders.body[1].id).toEqual(orderTwo.id);
    expect(orders.body[0].ticket.id).toEqual(ticketTwo.id);
    expect(orders.body[1].ticket.id).toEqual(ticketThree.id);
  });
});
