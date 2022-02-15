import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../app";

// -----------------
// ROUTES
// -----------------
export const ticketRoute = "/api/tickets";

// -----------------
// HELPER FUNCTIONS
// -----------------
export const generateTestId = () => new mongoose.Types.ObjectId().toHexString();

// NO ACCESS TO THE AUTH SERVICE
// SO WE NEED TO BUILD/FAKE THE SESSION COOKIE
export const generateTestCookie = async () => {
  // BUILD A JWT PAYLOAD {id, email}
  const payload = {
    id: generateTestId(),
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

export const generateNewTicket = async () => {
  const testTicket = {
    title: "Test Title",
    price: 20,
  };

  return request(app)
    .post(ticketRoute)
    .set("Cookie", await generateTestCookie())
    .send(testTicket);
};
