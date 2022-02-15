import request from "supertest";
import { app } from "../../app";
import { Ticket } from "../../models/ticket";
import { natsWrapper } from "../../nats-wrapper";
import {
  generateNewTicket,
  generateTestCookie,
  generateTestId,
  ticketRoute,
} from "../../test/test-utils";

describe("Route: Update ticket", () => {
  it("returns a 404 if ticket id doesn't exist", async () => {
    // Generate an id that should match
    // a standard mongodb id
    const testTicketId = generateTestId();

    await request(app)
      .put(`${ticketRoute}/${testTicketId}`)
      .set("Cookie", await generateTestCookie())
      .send({
        title: "test",
        price: 20,
      })
      .expect(404);
  });

  it("rejects updates if ticket is reserved", async () => {
    const cookie = await generateTestCookie();

    const response = await request(app)
      .post(ticketRoute)
      .set("Cookie", cookie)
      .send({ title: "Ticket title", price: 20 })
      .expect(201);

    const ticket = await Ticket.findById(response.body.id);
    ticket!.set({ orderId: generateTestId() });
    await ticket!.save();

    const updatedTicketBody = { title: "Updated", price: 100 };

    await request(app)
      .put(`${ticketRoute}/${response.body.id}`)
      .set("Cookie", cookie)
      .send(updatedTicketBody)
      .expect(400);
  });

  it("returns a 401 if user is not signed in", async () => {
    // Generate an id that should match
    // a standard mongodb id
    const testTicketId = generateTestId();

    await request(app)
      .put(`${ticketRoute}/${testTicketId}`)
      .send({
        title: "test",
        price: 20,
      })
      .expect(401);
  });

  it("returns a 401 if user doesn't own the ticket", async () => {
    const testTicket = await generateNewTicket();
    const testTicketId = testTicket.body.id;

    await request(app)
      .put(`${ticketRoute}/${testTicketId}`)
      .set("Cookie", await generateTestCookie())
      .send({
        title: "updated title",
        price: 30,
      })
      .expect(401);
  });

  it("returns a 400 if user provides invalid ticket title or price", async () => {
    const cookie = await generateTestCookie();

    const response = await request(app)
      .post(ticketRoute)
      .set("Cookie", cookie)
      .send({
        title: "test title",
        price: 20,
      })
      .expect(201);

    // Case Invalid title
    await request(app)
      .put(`${ticketRoute}/${response.body.id}`)
      .set("Cookie", cookie)
      .send({
        title: "",
        price: 20,
      })
      .expect(400);

    // Case Invalid price
    await request(app)
      .put(`${ticketRoute}/${response.body.id}`)
      .set("Cookie", cookie)
      .send({
        title: "test",
        price: -99,
      })
      .expect(400);
  });

  it("updates the ticket using a valid title and price", async () => {
    const cookie = await generateTestCookie();

    const response = await request(app)
      .post(ticketRoute)
      .set("Cookie", cookie)
      .send({ title: "Ticket title", price: 20 })
      .expect(201);

    const updatedTicketBody = { title: "Updated", price: 100 };

    const updatedTicket = await request(app)
      .put(`${ticketRoute}/${response.body.id}`)
      .set("Cookie", cookie)
      .send(updatedTicketBody)
      .expect(200);

    // const updatedTicket = await request(app)
    //   .get(`${ticketRoute}/${response.body.id}`)
    //   .send();

    expect(updatedTicket.body.title).toEqual(updatedTicketBody.title);
    expect(updatedTicket.body.price).toEqual(updatedTicketBody.price);
  });
});

describe("Publish: Update ticket", () => {
  it("publishes a ticket updated event", async () => {
    const cookie = await generateTestCookie();

    const response = await request(app)
      .post(ticketRoute)
      .set("Cookie", cookie)
      .send({ title: "Ticket title", price: 20 })
      .expect(201);

    const updatedTicketBody = { title: "Updated", price: 100 };

    const updatedTicket = await request(app)
      .put(`${ticketRoute}/${response.body.id}`)
      .set("Cookie", cookie)
      .send(updatedTicketBody)
      .expect(200);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
  });
});
