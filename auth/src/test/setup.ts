import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

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
