import request from "supertest";
import { app } from "../../app";
import { testUtils } from "../../test/test-utils";

describe("signin routes", () => {
  const signinRoute: string = "/api/users/signin";

  it("returns a 400 when email address does not exist", async () => {
    return request(app)
      .post(signinRoute)
      .send({
        email: "test@test.com",
        password: "123456",
      })
      .expect(400);
  });

  it("returns a 400 when incorrect password supplied", async () => {
    await testUtils.getCookieOnSignup();

    await request(app)
      .post(signinRoute)
      .send({ email: "test@test.com", password: "p" })
      .expect(400);
  });

  it("returns a 201 when signed in using correct credentials", async () => {
    await testUtils.getCookieOnSignup();

    const response = await request(app)
      .post(signinRoute)
      .send({ email: "test@test.com", password: "123456" })
      .expect(200);

    expect(response.get("Set-Cookie")).toBeDefined();
  });
});
