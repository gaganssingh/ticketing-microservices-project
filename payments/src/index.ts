import mongoose from "mongoose";
import { app } from "./app";
import { OrderCancelledListener } from "./events/listeners/order-cancelled-listener";
import { OrderCreatedListener } from "./events/listeners/order-created-listener";
import { natsWrapper } from "./nats-wrapper";

// DB CONNECTION & SERVER START
(async () => {
  if (!process.env.JWT_KEY) {
    // value of process.env.JWT_KEY is manually
    // defined using the terminal command:
    // kubectl create secret generic jwt-secret --from-literal=JWT_KEY=<key here>
    throw new Error("JWT_KEY must be defined");
  }

  if (!process.env.MONGO_URI) {
    // value of process.env.MONGO_URI has been defined
    // inside the tickets-depl file
    // Automatically assigned by docker on server startup
    throw new Error("MONGO_URI must be defined");
  }
  if (!process.env.NATS_CLIENT_ID) {
    // value of process.env.NATS_CLIENT_ID has been defined
    // inside the tickets-depl file
    // Automatically assigned by docker on server startup
    throw new Error("NATS_CLIENT_ID must be defined");
  }
  if (!process.env.NATS_URL) {
    // value of process.env.NATS_URL has been defined
    // inside the tickets-depl file
    // Automatically assigned by docker on server startup
    throw new Error("NATS_URL must be defined");
  }
  if (!process.env.NATS_CLUSTER_ID) {
    // value of process.env.NATS_CLUSTER_ID has been defined
    // inside the tickets-depl file
    // Automatically assigned by docker on server startup
    throw new Error("NATS_CLUSTER_ID must be defined");
  }

  try {
    // Connect to the NATS streaming server
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
    );

    // Graceful NATS client shutdown
    natsWrapper.client.on("close", () => {
      console.log("NATS connection closed 🟥");
      process.exit();
    });
    // Graceful NATS client shutdown: WATCHING FOR
    process.on("SIGINT", () => natsWrapper.client.close()); // ... INTERRUPT SIGNALS
    process.on("SIGTERM", () => natsWrapper.client.close()); // ... TERMINATE SIGNALS

    // **********
    // LISTENERS
    // **********
    new OrderCreatedListener(natsWrapper.client).listen();
    new OrderCancelledListener(natsWrapper.client).listen();

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 Connected to MongoDB");
  } catch (err) {
    console.error("🛑", err);
  }

  // START SERVER
  app.listen(3000, () =>
    console.log(`✅✅✅ Listening at http://localhost:3000`)
  );
})();
