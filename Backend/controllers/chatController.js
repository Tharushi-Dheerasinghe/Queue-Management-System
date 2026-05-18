import { GoogleGenerativeAI } from "@google/generative-ai";

export const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is missing. AI Chatbot is running in mock mode.");
      return res.status(200).json({
        success: true,
        reply: "Sorry, the AI chatbot is currently offline. Please set the GEMINI_API_KEY."
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a helpful assistant for a Smart Queue Management System used in hospitals, banks, supermarkets, and police stations. 
Answer the following user query briefly and politely: 
User query: ${message}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return res.status(200).json({ success: true, reply: responseText });
  } catch (error) {
    console.error("Chatbot error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
