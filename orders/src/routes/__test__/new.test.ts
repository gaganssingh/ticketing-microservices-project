import request from "supertest";
import { app } from "../../app";
import { Order, OrderStatus } from "../../models/order";
import { natsWrapper } from "../../nats-wrapper";
import {
  generateNewTicket,
  generateTestCookie,
  generateTestId,
  ordersRoute,
} from "../../test/test-utils";

describe("Route: New order", () => {
  it("return a 404 error if ticket does not exist", async () => {
    const ticketId = await generateTestId();

    await request(app)
      .post(ordersRoute)
      .set("Cookie", await generateTestCookie())
      .send({
        ticketId,
      })
      .expect(404);
  });

  it("return an error if ticket already reserved", async () => {
    // Build a test ticket & save to db
    const ticket = await generateNewTicket();

    // Build a test order using above ticket & save to db
    const order = Order.build({
      ticket,
      userId: "SomeRandomIdHere",
      status: OrderStatus.Created,
      expiresAt: new Date(),
    });
    await order.save();

    await request(app)
      .post(ordersRoute)
      .set("Cookie", await generateTestCookie())
      .send({
        ticketId: ticket.id,
      })
      .expect(400);
  });

  it("successfully reserves a ticket", async () => {
    const ticket = await generateNewTicket();

    await request(app)
      .post(ordersRoute)
      .set("Cookie", await generateTestCookie())
      .send({
        ticketId: ticket.id,
      })
      .expect(201);
  });
});

describe("Event: New order", () => {
  it("emits an order created event", async () => {
    const ticket = await generateNewTicket();

    await request(app)
      .post(ordersRoute)
      .set("Cookie", await generateTestCookie())
      .send({
        ticketId: ticket.id,
      })
      .expect(201);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
  });
});
