import { OrderStatus } from "@gsinghtickets/common";
import request from "supertest";
import { app } from "../../app";
import { Order } from "../../models/order";
import { Payment } from "../../models/payment";
import { stripe } from "../../stripe";
import {
  generateTestCookie,
  generateTestId,
  generateTestOrder,
  paymentsRoute,
} from "../../test/test-utils";

describe("Route: create charge", () => {
  it("returns a 404 if order doesn't exist", async () => {
    await request(app)
      .post(paymentsRoute)
      .set("Cookie", await generateTestCookie())
      .send({
        token: "hjgjwhe",
        orderId: generateTestId(),
      })
      .expect(404);
  });

  it("returns a 401 when user is not authorized", async () => {
    const order = await generateTestOrder();

    await request(app)
      .post(paymentsRoute)
      .set("Cookie", await generateTestCookie())
      .send({
        token: "hjgjwhe",
        orderId: order.id,
      })
      .expect(401);
  });

  it("returns a 400 if purchasing a cancelled order", async () => {
    const userId = generateTestId();

    const order = Order.build({
      id: generateTestId(),
      userId,
      version: 0,
      price: 20,
      status: OrderStatus.Cancelled,
    });
    await order.save();

    await request(app)
      .post("/api/payments")
      .set("Cookie", await generateTestCookie(userId))
      .send({
        orderId: order.id,
        token: "testtoken",
      })
      .expect(400);
  });

  it("returns a 201 with valid inputs", async () => {
    const userId = generateTestId();
    const price = Math.floor(Math.random() * 100000);
    const order = Order.build({
      id: generateTestId(),
      userId,
      version: 0,
      price,
      status: OrderStatus.Created,
    });
    await order.save();

    await request(app)
      .post("/api/payments")
      .set("Cookie", await generateTestCookie(userId))
      .send({
        token: "tok_visa",
        orderId: order.id,
      })
      .expect(201);

    const stripeCharges = await stripe.charges.list({ limit: 50 });
    const stripeCharge = stripeCharges.data.find((charge) => {
      return charge.amount === price * 100;
    });

    expect(stripeCharge).toBeDefined();
    expect(stripeCharge!.currency).toEqual("usd");

    const payment = await Payment.findOne({
      orderId: order.id,
      stripeId: stripeCharge!.id,
    });
    expect(payment).not.toBeNull();
  });
});
