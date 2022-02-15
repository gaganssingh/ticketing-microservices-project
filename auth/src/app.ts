import express from "express";
import { json } from "body-parser";
import "express-async-errors";
import cookieSession from "cookie-session";
import { NotFoundError, errorHandler } from "@gsinghtickets/common";

import { currentUserRouter } from "./routes/current-user";
import { signinRouter } from "./routes/signin";
import { signoutRouter } from "./routes/signout";
import { signupRouter } from "./routes/signup";

// INIT APP
const app = express();
app.set("trust proxy", true); // Allow ingress-nginx proxied connection through

// MIDDLEWARES
app.use(json()); // Body Parser
app.use(
  // Save JWT in cookie
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);

// ROUTES MOUNTING
app.use(currentUserRouter);
app.use(signinRouter);
app.use(signoutRouter);
app.use(signupRouter);

// Route not found error
app.all("*", async () => {
  throw new NotFoundError();
});

// MIDDLEWARES
app.use(errorHandler); // Error handler

export { app };
