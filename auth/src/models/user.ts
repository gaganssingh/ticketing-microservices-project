import mongoose from "mongoose";
import { Password } from "../services/password";

// Properties required to create
// a new user
interface UserAttrs {
  email: string;
  password: string;
}

// Describe properties that exist on
// a User model
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}

// Describe properties of a
// User document
interface UserDoc extends mongoose.Document {
  // Takes all properties that a mongoose document has
  // , and adds the following
  email: string;
  password: string;
}

// Schema
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
        delete ret.__v;
      },
    },
  }
);

// Pre-Save hook
userSchema.pre("save", async function (done) {
  if (this.isModified("password")) {
    const hashed = await Password.toHash(this.get("password"));
    this.set("password", hashed);

    done();
  }
});

// Method on the user schema
// enables typescript checking when using the
// User model
userSchema.statics.build = (attrs: UserAttrs) => new User(attrs);

// Init the model
const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export { User };
