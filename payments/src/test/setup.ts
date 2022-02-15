import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// WHAT FILE NEEDS TO BE MOCKED:
// Jest will use the DUMMY file with the same name
// from the folder __mocks__
jest.mock("../nats-wrapper.ts");

process.env.STRIPE_KEY =
  "sk_test_51K5DEDDoKWXzFvdY6RP2fBAAnPgFVsZwux6Ih1jpy8SgQmGQe0vg19QieKfBbxcC3DlhmzdfndRj90mjqxCwfB0800DToHEL2A";

let mongo: any;

// BEFORE RUNNING ANY TESTS
// SETUP THE MONGODB SERVER IN MEMORY
beforeAll(async () => {
  // SETUP ALL ENV VARIABLES
  process.env.JWT_KEY = "hsudeghrehgjieghe";

  // CREATE THE IN MEMORY MONGO SERVER
  mongo = await MongoMemoryServer.create();

  // GET THE URI OF THE IN MEMORY SERVER
  const mongoUri = mongo.getUri();

  // CONNECT TO THE IN MEMORY SERVER USING MONGOOSE
  await mongoose.connect(mongoUri);
});

// BEFORE RUNNING EACH TEST
// CLEAR ALL COLLECTIONS FROM THE IN MEMORY DB
beforeEach(async () => {
  // CLEAR ANY PREVIOUS MOCKS
  jest.clearAllMocks();

  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

// AFTER RUNNING ALL OF THE TESTS
// CLOSE MONGOOSE CONNECTION TO MONGODB
// & STOP MONGODB IN MEMORY SERVER
afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});
