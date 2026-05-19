import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected via Socket.io:", socket.id);
    
    // Allow clients to join branch-specific rooms for localized updates
    socket.on("joinBranch", (branchId) => {
      if (branchId) {
        socket.join(branchId.toString());
        console.log(`Socket ${socket.id} joined branch room: ${branchId}`);
      }
    });

    socket.on("joinBranches", (branchIds) => {
      if (!Array.isArray(branchIds)) return;
      branchIds.forEach((branchId) => {
        if (branchId) {
          socket.join(branchId.toString());
        }
      });
      console.log(`Socket ${socket.id} joined ${branchIds.length} branch room(s)`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    console.warn("Socket.io not initialized. Make sure initSocket was called.");
    return null;
  }
  return io;
};
