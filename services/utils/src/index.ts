import express from "express";
import dotenv from "dotenv";
import routes from "./routes.js";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { startSendMailConsumer } from "./consumer.js";
import { UPLOAD_DIR } from "./storage.js";

dotenv.config();

startSendMailConsumer();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const app = express();
app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Locally-stored uploads (fallback driver) are served from here.
app.use("/uploads", express.static(UPLOAD_DIR));

app.use("/api/utils", routes);

app.listen(process.env.PORT, () => {
  console.log(
    `Utils Service is running on http://localhost:${process.env.PORT}`
  );
});
