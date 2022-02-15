import { OrderCreatedListener } from "./events/listeners/order-created-listener";
import { natsWrapper } from "./nats-wrapper";

// DB CONNECTION & SERVER START
(async () => {
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

    // **************
    // LISTEN FOR MESSAGES/EVENTS
    // **************
    new OrderCreatedListener(natsWrapper.client).listen();
  } catch (err) {
    console.error("🛑", err);
  }
})();
