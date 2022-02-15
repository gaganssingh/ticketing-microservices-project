import request from "supertest";
import { app } from "../../app";
import { Ticket } from "../../models/ticket";
import { natsWrapper } from "../../nats-wrapper";
import { ticketRoute, generateTestCookie } from "../../test/test-utils";

describe("Route: Create a new ticket", () => {
  it("has a route handler listening to /api/tickets for post request", async () => {
    const response = await request(app).post(ticketRoute).send({});

    expect(response.status).not.toEqual(404);
  });

  it("can only be accessed if the user is signed in", async () => {
    await request(app).post(ticketRoute).send({}).expect(401);
  });

  it("returns a status other than 401 if user is signed in", async () => {
    const cookie = await generateTestCookie();

    const response = await request(app)
      .post(ticketRoute)
      .set("Cookie", cookie)
      .send({});

    expect(response.status).not.toEqual(401);
  });

  it("returns an error if an invalid title is provided", async () => {
    await request(app)
      .post(ticketRoute)
      .set("Cookie", await generateTestCookie())
      .send({
        title: "",
        price: 10,
      })
      .expect(400);

    await request(app)
      .post(ticketRoute)
      .set("Cookie", await generateTestCookie())
      .send({
        price: 10,
      })
      .expect(400);
  });

  it("returns an error if an invalid price is provided", async () => {
    await request(app)
      .post(ticketRoute)
      .set("Cookie", await generateTestCookie())
      .send({
        title: "title",
        price: -10,
      })
      .expect(400);

    await request(app)
      .post(ticketRoute)
      .set("Cookie", await generateTestCookie())
      .send({
        title: "title",
      })
      .expect(400);
  });

  it("creates a ticket with valid inputs", async () => {
    // Ensure no tickets exist in the db
    let tickets = await Ticket.find({});
    expect(tickets.length).toEqual(0);

    // Create a new ticket
    await request(app)
      .post(ticketRoute)
      .set("Cookie", await generateTestCookie())
      .send({
        title: "New Ticket",
        price: 20,
      })
      .expect(201);

    // Check to ensure ticked saved in mongodb
    tickets = await Ticket.find({});
    expect(tickets.length).toEqual(1);
    expect(tickets[0].title).toEqual("New Ticket");
    expect(tickets[0].price).toEqual(20);
  });
});

describe("Publish: Create a new ticket", () => {
  it("publishes a new ticket created event", async () => {
    // Create a new ticket
    await request(app)
      .post(ticketRoute)
      .set("Cookie", await generateTestCookie())
      .send({
        title: "New Ticket",
        price: 20,
      })
      .expect(201);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
  });
});
