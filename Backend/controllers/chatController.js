import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_CANDIDATES = ["gemini-2.5-flash", "gemini-2.0-flash"];

const buildPrompt = (userQuery) =>
  `You are a friendly and helpful assistant for a Smart Queue Management System. Provide brief, clear responses (2-3 sentences max) to help users with queue management questions.

User: ${userQuery}`;

const generateWithGemini = async (apiKey, userQuery) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildPrompt(userQuery);
  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);

      if (!result?.response) {
        continue;
      }

      const text = result.response.text()?.trim();
      if (text) {
        return text;
      }
    } catch (error) {
      lastError = error;
      const status = error?.status;

      if (status === 404) {
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error("No Gemini model returned a response");
};

const getFriendlyErrorReply = (error) => {
  const message = String(error?.message || "");
  const status = error?.status;

  if (status === 429 || message.includes("quota")) {
    return "I'm receiving too many requests right now. Please try again in a minute.";
  }

  if (
    status === 400 &&
    (message.includes("API key") || message.includes("API_KEY_INVALID"))
  ) {
    return "The AI assistant is temporarily unavailable due to server configuration. Please contact support.";
  }

  return "I'm experiencing technical difficulties. Please try again in a moment.";
};

export const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid message string is required",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing or empty. AI Chatbot is running in mock mode.");
      return res.status(200).json({
        success: true,
        reply:
          "Hello! I'm the Smart Queue Assistant. How can I help you with your queue management needs today? (AI features are temporarily offline, but I'm here to help!)",
      });
    }

    const userQuery = String(message).trim().substring(0, 500);
    const responseText = await generateWithGemini(apiKey, userQuery);

    return res.status(200).json({ success: true, reply: responseText });
  } catch (error) {
    console.error("Chatbot error:", error?.message || error);

    return res.status(200).json({
      success: true,
      reply: getFriendlyErrorReply(error),
    });
  }
};
