import request from "supertest";
import { app } from "../../app";
import { testUtils } from "../../test/test-utils";

describe("signout route", () => {
  const signoutRoute: string = "/api/users/signout";

  it("clears the cookie after signout", async () => {
    await testUtils.getCookieOnSignup();

    const response = await request(app).post(signoutRoute).send({});
    const sessionContent = response
      .get("Set-Cookie")[0]
      .split(";")[0]
      .split("=");

    expect(sessionContent[1]).toEqual("");
  });
});
