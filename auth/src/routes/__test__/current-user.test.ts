import request from "supertest";
import { app } from "../../app";
import { testUtils } from "../../test/test-utils";

describe("current user route", () => {
  const currentUserRoute: string = "/api/users/currentuser";

  it("responds with details about the current user", async () => {
    const cookie = await testUtils.getCookieOnSignup();

    const response = await request(app)
      .get(currentUserRoute)
      .set("Cookie", cookie)
      .send()
      .expect(200);

    expect(response.body.currentUser.email).toEqual("test@test.com");
  });

  it("responds with null if not signed in", async () => {
    const response = await request(app)
      .get(currentUserRoute)
      .send()
      .expect(200);

    expect(response.body.currentUser).toEqual(null);
  });
});
