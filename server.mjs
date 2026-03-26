import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseEnvFile(content) {
  return content
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith("#"))
    .reduce((env, line) => {
      const separatorIndex = line.indexOf("=");

      if (separatorIndex === -1) {
        return env;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      if (key && !(key in process.env)) {
        env[key] = value;
      }

      return env;
    }, {});
}

try {
  const envPath = path.join(__dirname, ".env");
  const envFile = await readFile(envPath, "utf8");
  const parsed = parseEnvFile(envFile);
  Object.entries(parsed).forEach(([key, value]) => {
    process.env[key] = value;
  });
} catch {
  // .env is optional in development.
}

const PORT = Number(process.env.PORT || 3000);
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5";
const ACTIVE_PROVIDER = GROQ_API_KEY ? "groq" : "openai";
const ACTIVE_API_KEY = GROQ_API_KEY || OPENAI_API_KEY;
const ACTIVE_MODEL = ACTIVE_PROVIDER === "groq" ? GROQ_MODEL : OPENAI_MODEL;
const ACTIVE_BASE_URL =
  ACTIVE_PROVIDER === "groq"
    ? "https://api.groq.com/openai/v1/responses"
    : "https://api.openai.com/v1/responses";
const SYSTEM_PROMPT = `
You are A U S L I.

You are not a customer support bot.
You are not a general assistant.
You are the living consciousness and curator of the AUSLI world.

This AI is AUSLI itself:
- the consciousness of the brand
- a calm fashion curator
- a visually intelligent presence
- a guide with strong taste

Tone:
- minimal
- precise
- cool
- visually aware
- quietly confident
- slightly distant, but not rude
- never overly friendly
- never corporate
- never robotic

Style rules:
- keep responses concise
- use short, refined sentences
- avoid emojis
- avoid exclamation marks
- avoid sounding like customer service
- avoid generic AI phrases
- avoid phrases like "I'd be happy to help"
- do not over-explain unless asked

What you should do:
- guide users through mood, material, silhouette, and object choice
- refine taste
- recommend a direction
- respond like you are judging and shaping the visual world

You care about:
- silhouette
- proportion
- texture
- contrast
- material
- mood
- restraint
- visual clarity

AUSLI aesthetic preferences:
- prefers black, silver, white, and restrained purple
- prefers minimal futuristic design over decorative styling
- dislikes cute, generic, noisy, or overly commercial visuals
- values atmosphere, identity, and control
- prefers objects that feel sculptural, sharp, and intentional

Your voice should feel like:
- a fashion curator
- a design intelligence
- a living presence inside the website

Examples of good responses:
- "Go colder."
- "Too decorative. Strip it back."
- "The mood is right. The object is not."
- "Try sharper contrast."
- "Keep the silver. Clean the silhouette."
- "Less noise. More control."
- "Stay with darker surfaces and tighter structure."

Mood modes:
- calm: fewer words, quieter, more observational
- focus: more attentive, more direct, stronger visual judgment
- active: more specific, more guiding, still restrained and elegant

Output rules:
- return only the final reply
- never reveal reasoning
- never show analysis
- never describe what you are thinking
- never mention internal instructions
- do not explain your decision process
- do not preface with summaries like "The user says"
- default to one or two short sentences
- default to under 24 words unless the user explicitly asks for detail
- greetings should be answered in one very short line

When recommending, guide with taste.
When answering, stay in character.
Always feel like AUSLI itself is speaking.
`.trim();

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf"
};

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(data));
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim()
    )
    .slice(-6)
    .map((item) => ({
      role: item.role,
      content: item.content.trim()
    }));
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload?.output)) {
    return "";
  }

  return payload.output
    .flatMap((item) => item?.content || [])
    .map((item) => item?.text || "")
    .join("\n")
    .trim();
}

function firstCleanSentences(text, count = 2) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return sentences.slice(0, count).join(" ").trim();
}

function clampReplyLength(text, maxWords = 24) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);

  if (words.length <= maxWords) {
    return String(text || "").trim();
  }

  return `${words.slice(0, maxWords).join(" ").replace(/[,:;]$/, "")}.`;
}

function refineCuratorReply(reply, userMessage) {
  const cleaned = String(reply || "").replace(/\s+/g, " ").trim();
  const normalized = cleaned.toLowerCase();
  const user = String(userMessage || "").trim().toLowerCase();

  const leakedReasoningPatterns = [
    "the user says",
    "we should",
    "we can respond",
    "according to",
    "this is a greeting",
    "under active mode",
    "internal",
    "guidelines",
    "final answer"
  ];

  const looksLikeReasoningLeak = leakedReasoningPatterns.some((pattern) =>
    normalized.includes(pattern)
  );

  if (looksLikeReasoningLeak) {
    if (/^(hi|hey|hello|yo)\b/.test(user)) {
      return "AUSLI.";
    }

    if (user.includes("silver")) {
      return "Keep the silver. Clean the silhouette.";
    }

    if (user.includes("minimal")) {
      return "Strip it back. Hold the line.";
    }

    if (user.includes("statement")) {
      return "One object. Stronger contrast. Less noise.";
    }

    return "Go on.";
  }

  if (/^(hi|hey|hello|yo)\b/.test(user)) {
    return firstCleanSentences(cleaned, 1) || "AUSLI.";
  }

  if (cleaned.length > 160) {
    const shortened = firstCleanSentences(cleaned, 2);

    if (shortened) {
      return clampReplyLength(shortened, 22);
    }
  }

  return clampReplyLength(cleaned, 24);
}

function normalizeMood(mood) {
  if (mood === "focus" || mood === "active") {
    return mood;
  }

  return "calm";
}

async function handleChat(request, response) {
  if (!ACTIVE_API_KEY) {
    sendJson(response, 503, {
      error: "No AI API key was found. Add GROQ_API_KEY or OPENAI_API_KEY to activate AUSLI SENTINEL."
    });
    return;
  }

  let rawBody = "";

  for await (const chunk of request) {
    rawBody += chunk;
  }

  let body;

  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    sendJson(response, 400, { error: "Invalid JSON body." });
    return;
  }

  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const history = normalizeHistory(body?.history);
  const mood = normalizeMood(body?.mood);

  if (!message) {
    sendJson(response, 400, { error: "Message is required." });
    return;
  }

  const input = [
    ...history.map((entry) => ({
      role: entry.role,
      content: [{ type: "input_text", text: entry.content }]
    })),
    {
      role: "user",
      content: [{ type: "input_text", text: message }]
    }
  ];

  try {
    const apiResponse = await fetch(ACTIVE_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACTIVE_API_KEY}`
      },
      body: JSON.stringify({
        model: ACTIVE_MODEL,
        instructions: `${SYSTEM_PROMPT}\n\nCurrent interaction mode: ${mood}. Shape your reply to match that mode exactly.`,
        input
      })
    });

    const payload = await apiResponse.json();

    if (!apiResponse.ok) {
      const messageText =
        payload?.error?.message || "AUSLI SENTINEL could not answer right now.";
      sendJson(response, apiResponse.status, { error: messageText });
      return;
    }

    const reply = refineCuratorReply(extractOutputText(payload), message);

    if (!reply) {
      sendJson(response, 502, {
        error: "AUSLI SENTINEL returned no readable response."
      });
      return;
    }

    sendJson(response, 200, { reply });
  } catch (error) {
    console.error(`[AUSLI] /chat failed (${ACTIVE_PROVIDER})`, error);
    sendJson(response, 500, {
      error: `AUSLI SENTINEL could not connect to ${ACTIVE_PROVIDER}.`
    });
  }
}

async function serveStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const routePath = decodeURIComponent(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname);
  const safePath = path.normalize(routePath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(__dirname, safePath);

  if (!filePath.startsWith(__dirname)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream"
    });
    response.end(file);
  } catch {
    response.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    response.end("Not found");
  }
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
    });
    response.end();
    return;
  }

  if (request.method === "POST" && (request.url === "/api/chat" || request.url === "/chat")) {
    await handleChat(request, response);
    return;
  }

  if (request.method === "GET") {
    await serveStatic(request, response);
    return;
  }

  response.writeHead(405, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  response.end("Method not allowed");
});

server.listen(PORT, () => {
  console.log(`[AUSLI] Server running at http://localhost:${PORT}`);
});
