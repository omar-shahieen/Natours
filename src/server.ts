import './config/env.js';
import mongoose from "mongoose";
import app from "./app.js";
import initializeRedisClient from "./utils/redis"

/* ===============================
   UNCAUGHT EXCEPTIONS (sync)
================================ */



process.on('uncaughtException', (err) => {
  console.log("uncaughtException : shutting down...");
  console.log(err);
  process.exit(1);

});




/* ===============================
  DB Connection
================================ */

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DB_PASSWORD)
  .replace("<USER_NAME>", process.env.DB_USERNAME!);
mongoose.connect(DB)
  .then(() => {
    console.log("DB Connected to ", mongoose.connection.name);
  })
  .catch((err: Error) => console.log(err.message));

/* ===============================
   Cache connection 
================================ */

await initializeRedisClient();


/* ===============================
   SERVER
================================ */
const port = process.env.PORT;

const server = app.listen(port, () => {

  console.log(`App running on port ${port}...`);

});

/* =============================
  unhandledRejection global error handling 
 ================================ */



process.on("unhandledRejection", async (err: Error) => {
  console.error("UNHANDLED REJECTION 💥 Shutting down...");

  console.error(err.name, err.message);

  server.close(async () => {
    try {
      await mongoose.connection.close(false);
      console.log("MongoDB connection closed.");
      process.exit(1);
    } catch (error) {
      console.error("Error closing MongoDB connection:", error);
      process.exit(1);
    }
  });
});
