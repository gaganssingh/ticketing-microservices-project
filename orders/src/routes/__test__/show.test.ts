import request from "supertest";
import { app } from "../../app";
import {
  ordersRoute,
  generateNewTicket,
  generateTestCookie,
} from "../../test/test-utils";

describe("Route: show order", () => {
  it("Fetches the order", async () => {
    const ticket = await generateNewTicket();

    const user = await generateTestCookie();
    const { body: order } = await request(app)
      .post(ordersRoute)
      .set("Cookie", user)
      .send({ ticketId: ticket.id })
      .expect(201);

    const { body: fetchedOrder } = await request(app)
      .get(`${ordersRoute}/${order.id}`)
      .set("Cookie", user)
      .expect(200);

    expect(fetchedOrder.ticket.id).toEqual(ticket.id);
  });

  it("returns a 401 error when user not authorized", async () => {
    const ticket = await generateNewTicket();

    const { body: order } = await request(app)
      .post(ordersRoute)
      .set("Cookie", await generateTestCookie())
      .send({ ticketId: ticket.id })
      .expect(201);

    const { body: fetchedOrder } = await request(app)
      .get(`${ordersRoute}/${order.id}`)
      .set("Cookie", await generateTestCookie())
      .expect(401);
  });
});
