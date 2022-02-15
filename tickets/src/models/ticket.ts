import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

// Properties required when
// creating a new ticket
interface TicketAttrs {
  title: string;
  price: number;
  userId: string;
}

// Properties that exist on
// a ticket document
interface TicketDoc extends mongoose.Document {
  // All properties of mongoose.Document
  // plus these additional properties:
  title: string;
  price: number;
  userId: string;
  orderId?: string; // "?" = Optional
  version: number; // custom versionKey, instead of default "__v"
}

// Properties that exist on
// a ticket model
interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
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
    },
    userId: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
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

// Method on the ticket schema
// This enables typescript checking
// on the user model
ticketSchema.statics.build = (attrs: TicketAttrs) => new Ticket(attrs);

// INIT THE MODEL
const Ticket = mongoose.model<TicketDoc, TicketModel>("Ticket", ticketSchema);

export { Ticket };
