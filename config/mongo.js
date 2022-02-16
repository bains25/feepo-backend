import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { getDBAddress } from './aws.js'

let database = null;
let mongoDBURL = null;

async function startDatabase() {
  if(process.env.NODE_ENV === 'production') {
      mongoDBURL = getDBAddress();
      const connection = await MongoClient.connect(mongoDBURL, {useNewUrlParser: true});
      database = connection.db();
      console.log("Connecting to production database...");
  }
  else {
      // Spins up a MongoDB server programmatically from within nodejs, 
      // for testing or mocking during development. By default it holds the data in memory.
      const mongo = new MongoMemoryServer();
      await mongo.start();
      mongoDBURL = await mongo.getUri();
      const connection = await MongoClient.connect(mongoDBURL, {useNewUrlParser: true});
      database = connection.db();
      console.log("Connecting to database on mongo memory server...");
  }
}

async function getDatabase() {
  if (!database) await startDatabase();
  return { database, mongoDBURL };
}

export {
  getDatabase,
  startDatabase,
};