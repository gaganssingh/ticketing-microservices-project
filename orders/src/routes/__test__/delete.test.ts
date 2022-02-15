import request from "supertest";
import { app } from "../../app";
import { Order, OrderStatus } from "../../models/order";
import { natsWrapper } from "../../nats-wrapper";
import {
  ordersRoute,
  generateNewTicket,
  generateTestCookie,
} from "../../test/test-utils";

describe("Route: delete order", () => {
  it("should throw a 401 error if user not authorized", async () => {
    const ticket = await generateNewTicket();

    const { body: orderToDelete } = await request(app)
      .post(ordersRoute)
      .set("Cookie", await generateTestCookie())
      .send({ ticketId: ticket.id })
      .expect(201);

    await request(app).delete(`${ordersRoute}/${orderToDelete.id}`).expect(401);
  });

  it("should cancel the order if user is authorized", async () => {
    const ticket = await generateNewTicket();

    const user = await generateTestCookie();
    const { body: orderToDelete } = await request(app)
      .post(ordersRoute)
      .set("Cookie", user)
      .send({ ticketId: ticket.id })
      .expect(201);

    await request(app)
      .delete(`${ordersRoute}/${orderToDelete.id}`)
      .set("Cookie", user)
      .expect(204);

    const cancelledOrder = await Order.findById(orderToDelete.id);

    expect(cancelledOrder!.status).toEqual(OrderStatus.Cancelled);
  });
});

describe("Event: delete order", () => {
  it("emits an order cancelled event", async () => {
    const ticket = await generateNewTicket();

    const user = await generateTestCookie();
    const { body: orderToDelete } = await request(app)
      .post(ordersRoute)
      .set("Cookie", user)
      .send({ ticketId: ticket.id })
      .expect(201);

    await request(app)
      .delete(`${ordersRoute}/${orderToDelete.id}`)
      .set("Cookie", user)
      .expect(204);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
  });
});
