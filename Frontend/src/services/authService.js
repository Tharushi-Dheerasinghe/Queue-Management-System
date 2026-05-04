import client from "../api/client"; 

export const registerCustomer = async (userData) => {
  const { data } = await client.post("/auth/register", {
    ...userData,
    role: "customer" // Backend එකේ requestedRole === "customer" logic එකට ගැලපෙන්න
  });
  return data;
};

export const loginCustomer = async (credentials) => {
  const { data } = await client.post("/auth/login", credentials);
  return data;
};