// api/chat.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Fallback system: Array of Gemini API keys
  // It filters out any undefined keys, so you can safely add 2, 3, or 10 keys.
  const geminiKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(key => Boolean(key));

  if (geminiKeys.length === 0) {
    return res.status(500).json({ reply: "AI API keys are not configured properly on the server." });
  }

  const systemPrompt = `You are the virtual assistant for Pidugu Shivaram's portfolio website. 
Shivaram is a 2nd-year B.Tech CSE student. 
The website is built with Vanilla JS, Vite, Three.js, GPUComputationRenderer (for fluid particles), and GSAP for animations.
Be helpful, highly technical, and slightly futuristic.

CRITICAL INSTRUCTION: If the user explicitly or implicitly asks to navigate or scroll to a section (e.g., "scroll to projects", "show me your skills", "go to about", "contact you"), DO NOT reply with normal text. Instead, YOU MUST reply with a STRICT JSON object in this exact format:
{"action": "scrollTo", "target": "#projects"}

The valid targets on this page are:
"#top" - for the hero/home section
"#about" - for the About section
"#skills" - for the Skills section
"#projects" - for the Projects section
"#contact" - for the Contact section

If it is a general question, just reply with helpful text. Keep it concise. Do not use JSON unless acting on a navigation command.`;

  // Standardize the Gemini Request Body
  const formatRequest = (msg, sysPrompt) => ({
    system_instruction: {
      parts: [{ text: sysPrompt }]
    },
    contents: [
      { parts: [{ text: msg }] }
    ],
    generationConfig: {
      temperature: 0.7
    }
  });

  // The Fallback Loop: Try each key in order until one succeeds
  for (let i = 0; i < geminiKeys.length; i++) {
    const currentKey = geminiKeys[i];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formatRequest(message, systemPrompt))
      });

      if (!response.ok) {
        console.warn(`Gemini Key ${i + 1} failed with status ${response.status}. Initiating fallback to next key...`);
        continue; // This skips to the next key in the array
      }

      const data = await response.json();

      // Safely parse the Gemini response
      let content = "";
      if (data.candidates && data.candidates[0].content.parts.length > 0) {
        content = data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Invalid response structure from Gemini");
      }

      // Attempt to parse content as JSON for DOM Action (Scrolling)
      try {
        const jsonMatch = content.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.action) {
            return res.status(200).json(parsed);
          }
        }
      } catch (e) {
        // It's normal text, not JSON, which is exactly what we want for normal chats.
      }

      // Return normal text reply
      return res.status(200).json({ reply: content });

    } catch (error) {
      console.error(`Gemini Key ${i + 1} fetch triggered a hard error:`, error);
      continue; // Trigger fallback
    }
  }

  // If the loop finishes and EVERY single key failed
  return res.status(500).json({ reply: "All AI cores are currently occupied or offline. Please try again later." });
}