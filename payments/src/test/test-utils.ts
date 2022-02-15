import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../app";
import { Order } from "../models/order";
import { OrderStatus } from "@gsinghtickets/common";

// -----------------
// ROUTES
// -----------------
export const ticketRoute = "/api/ticket";
export const paymentsRoute = "/api/payments";

// -----------------
// HELPER FUNCTIONS
// -----------------
export const generateTestId = () => new mongoose.Types.ObjectId().toHexString();

// NO ACCESS TO THE AUTH SERVICE
// SO WE NEED TO BUILD/FAKE THE SESSION COOKIE
export const generateTestCookie = async (id?: string) => {
  // BUILD A JWT PAYLOAD {id, email}
  const payload = {
    id: id || generateTestId(),
    email: "test@test.com",
  };

  // CREATE THE JWT
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  // BUILD A SESSION OBJECT {jwt: <JWT TOKEN>}
  const session = { jwt: token };

  // CONVERT SESSION OBJECT TO JSON
  const sessionJSON = JSON.stringify(session);

  // CONVERT JSONified  SESSION TO BASE64
  const base64 = Buffer.from(sessionJSON).toString("base64");

  // RETURN THE SESSION AS THE COOKIE
  return [`session=${base64}`];
};

export const generateTestOrder = async (id?: string) => {
  const order = Order.build({
    id: generateTestId(),
    version: 0,
    userId: generateTestId(),
    price: 20,
    status: OrderStatus.Created,
  });
  await order.save();
  return order;
};
