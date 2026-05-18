import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";
import http from "http";
import { initSocket } from "./utils/socket.js";

dotenv.config();

// DB connect
connectDB();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});