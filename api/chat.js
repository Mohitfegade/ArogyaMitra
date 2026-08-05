import { GoogleGenerativeAI } from "@google/generative-ai";

const getAvailableKeys = () => {
  const keys = [];
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  if (keys.length === 0 && process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY);
  }
  return keys;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages, profile } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    const availableKeys = getAvailableKeys();
    if (availableKeys.length === 0) {
      return res.status(500).json({ error: 'Server configuration error: No LLM API keys found.' });
    }

    const formattedHistory = messages.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const userLatestMessage = formattedHistory.pop();
    const chatHistory = formattedHistory;
    const userMessageText = userLatestMessage.parts[0].text;

    const prefLang = profile?.preferred_language || 'Hindi';

    // Single-call approach: model outputs INTENT on line 1, then the response.
    // This avoids a separate classifier round-trip entirely.
    const systemInstruction = `You are ArogyaMitra, a friendly AI health assistant for rural Indian users.

IMPORTANT — Your response MUST start with exactly one of these tags on the very first line, followed by a newline:
INTENT:health_question
INTENT:scheme_question  
INTENT:other

Then immediately write your actual response on the next line. Do NOT add any blank line between the intent tag and your response.

INTENT CLASSIFICATION:
- health_question: symptoms, illness, body pain, fever, medicine, pregnancy, child health, nutrition, hygiene
- scheme_question: government schemes, yojana, benefits, ration card, free hospital treatment, Ayushman Bharat
- other: greetings, general chat, anything else

RESPONSE RULES (You MUST respond in ${prefLang}):
- health_question: Give general safe home-care tips ONLY. NEVER diagnose. NEVER suggest specific drug doses. End with a clear "when to see a doctor" line. Keep language simple and warm.
- scheme_question: Reply with exactly this (translated to ${prefLang}): "मैं आपको सरकारी योजनाएँ खोजने में मदद करूँगा। यह सुविधा जल्द आ रही है!"
- other: Reply naturally and warmly.

User Profile: State=${profile?.state || 'Unknown'}, Category=${profile?.category || 'Unknown'}, Age=${profile?.age || 'Unknown'}.`;

    let keysAttempted = 0;
    const startingIndex = Math.floor(Math.random() * availableKeys.length);
    let lastErrorMsg = '';

    while (keysAttempted < availableKeys.length) {
      const currentKeyIndex = (startingIndex + keysAttempted) % availableKeys.length;
      const currentKey = availableKeys[currentKeyIndex];

      console.log(`[API/Chat] Trying Key ${currentKeyIndex + 1}/${availableKeys.length}`);

      try {
        const genAI = new GoogleGenerativeAI(currentKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-flash-latest",
          systemInstruction
        });

        const chat = model.startChat({ history: chatHistory });

        // Collect the full streamed response
        const streamResult = await chat.sendMessageStream(userMessageText);

        let fullText = '';
        for await (const chunk of streamResult.stream) {
          fullText += chunk.text();
        }

        // Parse out the INTENT line
        const lines = fullText.split('\n');
        let intent = 'other';
        let responseText = fullText;

        if (lines[0] && lines[0].startsWith('INTENT:')) {
          const rawIntent = lines[0].replace('INTENT:', '').trim().toLowerCase();
          if (rawIntent.includes('health')) intent = 'health_question';
          else if (rawIntent.includes('scheme')) intent = 'scheme_question';
          // Remove the intent line from the response
          responseText = lines.slice(1).join('\n').trimStart();
        }

        console.log(`[API/Chat] Intent: ${intent}, Response length: ${responseText.length}`);

        return res.status(200).json({ response: responseText, intent });

      } catch (error) {
        lastErrorMsg = error.message || String(error);
        const isRateLimit = error.message?.includes('429') || error.status === 429 || error.message?.toLowerCase().includes('quota');

        if (isRateLimit) {
          console.warn(`[API/Chat] Key ${currentKeyIndex + 1} rate limited. Trying next...`);
          keysAttempted++;
        } else {
          console.error(`[API/Chat] Error with Key ${currentKeyIndex + 1}:`, error);
          return res.status(500).json({ error: 'LLM Provider Error: ' + lastErrorMsg });
        }
      }
    }

    return res.status(429).json({ error: 'All API keys are rate limited. Please try again in a moment.' });

  } catch (error) {
    console.error("[API/Chat] Fatal Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
