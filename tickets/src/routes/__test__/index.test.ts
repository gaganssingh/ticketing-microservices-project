import request from "supertest";
import { app } from "../../app";
import { generateNewTicket, ticketRoute } from "../../test/test-utils";

describe("index", () => {
  it("returns all tickets", async () => {
    await generateNewTicket();
    await generateNewTicket();
    await generateNewTicket();

    const response = await request(app).get(ticketRoute).send().expect(200);

    expect(response.body.length).toBe(3);
  });
});
