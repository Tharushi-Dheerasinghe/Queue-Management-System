import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.argv[2] || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("No API key provided");
  process.exit(1);
}

const models = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
];

const genAI = new GoogleGenerativeAI(apiKey);

for (const modelName of models) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Reply with exactly: OK");
    console.log(`${modelName}:`, result.response.text().trim());
  } catch (error) {
    const message = error?.message || String(error);
    console.log(`${modelName}: ERROR`, message.split("\n")[0]);
  }
}
