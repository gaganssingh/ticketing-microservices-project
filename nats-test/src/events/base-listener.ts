import { Message, Stan } from "node-nats-streaming";
import { Subjects } from "./subjects";

interface Event {
  subject: Subjects;
  data: any;
}

export abstract class Listener<T extends Event> {
  abstract subject: T["subject"]; // e.g. ticket:created
  abstract queueGroupName: string; //group that this listener belons to
  abstract onMessage(data: T["data"], msg: Message): void; // do something when a message is received
  private client: Stan;
  protected ackWait = 5 * 1000; // 5seconds. how long to wait for the acknowledgement

  constructor(client: Stan) {
    this.client = client;
  }

  // Parse JSON message to readable format
  parseMessage(msg: Message) {
    const data = msg.getData();
    return typeof data === "string"
      ? JSON.parse(data)
      : JSON.parse(data.toString("utf8"));
  }

  // Configure subscription options
  subscriptionOptions() {
    return this.client
      .subscriptionOptions()
      .setDeliverAllAvailable() // deliver all messages ever sent, on the first time a listener is created
      .setManualAckMode(true) // enable manual acknowledgement of the incoming message/event
      .setAckWait(this.ackWait)
      .setDurableName(this.queueGroupName); // Track all messages/events processes by this instance
  }

  // START LISTENING TO INCOMING messages/events
  listen() {
    const subscription = this.client.subscribe(
      this.subject,
      this.queueGroupName,
      this.subscriptionOptions()
    );

    subscription.on("message", (msg: Message) => {
      console.log(`Message received: ${this.subject} / ${this.queueGroupName}`);

      const parsedData = this.parseMessage(msg);
      this.onMessage(parsedData, msg);
    });
  }
}
