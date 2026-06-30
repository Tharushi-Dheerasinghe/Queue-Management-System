import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_CANDIDATES = ["gemini-2.5-flash", "gemini-3.5-flash"];

const buildPromptWithHistory = (userQuery, history = []) => {
  let context = "You are a friendly and helpful assistant for a Queue Management System. IMPORTANT: You MUST answer the user in the EXACT SAME LANGUAGE they used in their query. If they ask in Sinhala, reply in Sinhala. If they ask in English, reply in English.\n\nCRITICAL INSTRUCTIONS FOR BOOKING A TOKEN:\nIf the user asks how to get or book a token, you MUST list these exact steps in order:\n1. Select your desired industry category (e.g., Hospital, Bank) from the Home page.\n2. Select your preferred Organization and Branch.\n3. Choose the Service you need.\n4. Click 'Confirm Booking' to generate your token number.\n\nAnswer any other questions related to the system (e.g., waiting time, people ahead, cancellation) briefly and clearly.\n\n";

  if (Array.isArray(history)) {
    // Take the last 6 turns to keep context short, fast, and fit in rate limits
    const recentHistory = history.slice(-6);
    recentHistory.forEach((turn) => {
      const sender = turn.sender || turn.role || "";
      const text = turn.text || turn.content || "";
      if (sender && text) {
        const roleLabel = sender === "user" ? "User" : "Assistant";
        context += `${roleLabel}: ${text}\n`;
      }
    });
  }

  context += `User: ${userQuery}\nAssistant:`;
  return context;
};

const generateWithGemini = async (apiKey, userQuery, history = []) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildPromptWithHistory(userQuery, history);
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

const getSmartLocalResponse = (query) => {
  const q = String(query || "").toLowerCase();

  if (q.includes("token") && (q.includes("get") || q.includes("book") || q.includes("create") || q.includes("take") || q.includes("ganna"))) {
    return "To get a token, select your industry category (like Bank or Hospital) on our home page, select your preferred organization and branch, choose your desired service, and click 'Confirm Booking'. Your token prefix and number will be generated immediately.";
  }

  if (q.includes("track") || q.includes("status") || q.includes("check") || q.includes("where") || q.includes("bala")) {
    return "You can track your live queue status on the 'Track Queue' page. Simply search using your Token Number (e.g. AS-MA-PH-002) to view the live number of people ahead of you and your estimated wait time in real-time.";
  }

  if (q.includes("remove") || q.includes("cancel") || q.includes("delete") || q.includes("ayin")) {
    return "To cancel your booking, go to the 'Track Queue' page where your active tokens are listed, and click the 'Remove' button. This will instantly delete the token from the queue and reduce wait times for everyone else.";
  }

  if (q.includes("busy") || q.includes("queue") || q.includes("wait") || q.includes("in front")) {
    return "Our system dynamically calculates live estimated wait times based on the active counters serving customers. As counters process bookings, your position and estimated wait will update on your screen automatically.";
  }

  if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("singlish") || q.includes("sinhala")) {
    return "Hello! I am your Smart Queue Assistant. How can I help you book, track, or cancel your queue tokens today?";
  }

  return "I'm the Smart Queue Assistant! You can ask me how to book a token, track your live queue status, cancel a token, or view branch queue lists. How can I help you today?";
};

export const handleChat = async (req, res) => {
  const { message, history } = req.body;
  
  try {
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid message string is required",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing or empty. AI Chatbot is running in fallback smart local mode.");
      return res.status(200).json({
        success: true,
        reply: getSmartLocalResponse(message),
      });
    }

    const userQuery = String(message).trim().substring(0, 500);
    const responseText = await generateWithGemini(apiKey, userQuery, history);

    return res.status(200).json({ success: true, reply: responseText });
  } catch (error) {
    console.error("Chatbot error (falling back to smart local response):", error?.message || error);

    // Dynamic fallback to smart local responder under high concurrency/429 rate-limiting
    return res.status(200).json({
      success: true,
      reply: getSmartLocalResponse(message),
    });
  }
};
