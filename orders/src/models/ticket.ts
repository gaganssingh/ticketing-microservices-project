import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { Order, OrderStatus } from "./order";

interface TicketAttrs {
  id: string;
  title: string;
  price: number;
}

export interface TicketDoc extends mongoose.Document {
  title: string;
  price: number;
  version: number; // custom versionKey, instead of default "__v"
  isReserved(): Promise<boolean>;
}

interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
  findByPreviousVersion(event: {
    id: string;
    version: number;
  }): Promise<TicketDoc | null>;
}

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

// OCC - Optimistic Concurrency Conrtol
// Tell mongoose to track version numbers
// using a key of "version" instead of the default "__v"
ticketSchema.set("versionKey", "version");
// Enable Optimistic Concurrency Conrtol
ticketSchema.plugin(updateIfCurrentPlugin);

// CUSTOM METHODS on the schema
ticketSchema.statics.build = (attrs: TicketAttrs) =>
  new Ticket({
    _id: attrs.id,
    title: attrs.title,
    price: attrs.price,
  });

ticketSchema.statics.findByPreviousVersion = (event: {
  id: string;
  version: number;
}) =>
  Ticket.findOne({
    _id: event.id,
    version: event.version - 1, // version - 1 => Example: We are processing version 3,
    // but if version 2 does not exist, that means we are processing the updates
    // out of order, as we likely missed version 2
  });

ticketSchema.methods.isReserved = async function () {
  const existingOrder = await Order.findOne({
    ticket: this,
    status: {
      // If order's status is either one of the "OrderStatus" enums
      // then it is reserved. Otherwise it's free to purchase
      $in: [
        OrderStatus.Created,
        OrderStatus.AwaitingPament,
        OrderStatus.Complete,
      ],
    },
  });

  return !!existingOrder; // if (null) returns false. if (existingOrder) returns true
};

const Ticket = mongoose.model<TicketDoc, TicketModel>("Ticket", ticketSchema);

export { Ticket };
