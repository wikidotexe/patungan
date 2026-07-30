// Helper pemanggilan AI (endpoint OpenAI-compatible)

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<Record<string, unknown>>;
};

export function getAIConfig() {
  return {
    apiKey: import.meta.env.VITE_AI_API_KEY?.trim(),
    endpoint: import.meta.env.VITE_AI_API_ENDPOINT?.trim(),
    model: import.meta.env.VITE_AI_MODEL?.trim() || "free-forever",
  };
}

// Sebagian server tetap membalas SSE ("data: {...}") walau stream dimatikan,
// jadi teks response digabungkan manual bila bukan JSON biasa.
function parseContent(raw: string): string {
  try {
    return JSON.parse(raw)?.choices?.[0]?.message?.content ?? "";
  } catch {
    // fallback: gabungkan potongan SSE
    return raw
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter((payload) => payload && payload !== "[DONE]")
      .reduce((acc, payload) => {
        try {
          const chunk = JSON.parse(payload)?.choices?.[0];
          return acc + (chunk?.delta?.content ?? chunk?.message?.content ?? "");
        } catch {
          return acc;
        }
      }, "");
  }
}

export async function callAI(messages: ChatMessage[]): Promise<string> {
  const { apiKey, endpoint, model } = getAIConfig();

  const res = await fetch(`${endpoint.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: false }),
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${raw}`);

  return parseContent(raw);
}
