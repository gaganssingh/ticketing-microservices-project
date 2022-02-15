import mongoose from "mongoose";
import request from "supertest";
import { app } from "../../app";
import {
  generateTestCookie,
  generateTestId,
  ticketRoute,
} from "../../test/test-utils";

describe("show ticket route", () => {
  it("returns a 404 if ticket is not found", async () => {
    // Generate an id that should match
    // a standard mongodb id
    const testTicketId = generateTestId();

    await request(app).get(`${ticketRoute}/${testTicketId}`).send().expect(404);
  });

  it("returns the ticket if the ticket exists and is found", async () => {
    const testTicket = {
      title: "Test Title",
      price: 20,
    };

    const response = await request(app)
      .post(ticketRoute)
      .set("Cookie", await generateTestCookie())
      .send({
        title: testTicket.title,
        price: testTicket.price,
      })
      .expect(201);

    const ticketResponse = await request(app)
      .get(`${ticketRoute}/${response.body.id}`)
      .send()
      .expect(200);

    expect(ticketResponse.body.title).toEqual(testTicket.title);
    expect(ticketResponse.body.price).toEqual(testTicket.price);
  });
});
