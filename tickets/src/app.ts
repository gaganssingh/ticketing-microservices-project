import express from "express";
import { json } from "body-parser";
import "express-async-errors";
import cookieSession from "cookie-session";
import {
  NotFoundError,
  errorHandler,
  currentUser,
} from "@gsinghtickets/common";

import { createTicketRouter } from "./routes/new";
import { showTicketRouter } from "./routes/show";
import { indexTicketRouter } from "./routes";
import { updateTicketRouter } from "./routes/update";

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
app.use(currentUser); // If user is signed, this sets the req.currentUser property

// ROUTES MOUNTING
app.use(createTicketRouter);
app.use(showTicketRouter);
app.use(indexTicketRouter);
app.use(updateTicketRouter);

// Route not found error
app.all("*", async () => {
  throw new NotFoundError();
});

// MIDDLEWARES
app.use(errorHandler); // Error handler

export { app };
