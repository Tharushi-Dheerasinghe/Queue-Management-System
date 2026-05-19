import { GoogleGenerativeAI } from "@google/generative-ai";

export const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: "Valid message string is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.warn("GEMINI_API_KEY is missing or empty. AI Chatbot is running in mock mode.");
      return res.status(200).json({
        success: true,
        reply: "Hello! I'm the Smart Queue Assistant. How can I help you with your queue management needs today? (AI features are temporarily offline, but I'm here to help!)"
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const userQuery = String(message).trim().substring(0, 500);
    const prompt = `You are a friendly and helpful assistant for a Smart Queue Management System. Provide brief, clear responses (2-3 sentences max) to help users with queue management questions.

User: ${userQuery}`;

    const result = await model.generateContent(prompt);
    
    if (!result || !result.response) {
      console.error("Invalid response from Gemini API");
      return res.status(200).json({ 
        success: true, 
        reply: "I'm having trouble processing that right now. Please try again." 
      });
    }

    const responseText = result.response.text();

    return res.status(200).json({ success: true, reply: responseText });
  } catch (error) {
    console.error("Chatbot error:", error.message || error);
    
    return res.status(200).json({ 
      success: true, 
      reply: "I'm experiencing technical difficulties. Please try again in a moment."
    });
  }
};
