import { io } from "socket.io-client";

export const getSocketServerUrl = () => {
  const base = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";
  return String(base).replace(/\/$/, "").replace(/\/api$/, "");
};

export const createQueueSocket = () => {
  return io(getSocketServerUrl(), {
    transports: ["websocket", "polling"],
    reconnection: true,
  });
};

export const joinTrackedBranches = (socket, branchIds = []) => {
  const uniqueBranchIds = [...new Set(branchIds.filter(Boolean).map((id) => String(id)))];
  if (!socket || uniqueBranchIds.length === 0) return;

  uniqueBranchIds.forEach((branchId) => socket.emit("joinBranch", branchId));
  socket.emit("joinBranches", uniqueBranchIds);
};
