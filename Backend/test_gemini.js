import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) {
  console.error("Set GEMINI_API_KEY in Backend/.env before running this script.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

model
  .generateContent("Say hello in one short sentence.")
  .then((res) => console.log(res.response.text()))
  .catch((error) => console.error("ERROR:", error.message));
