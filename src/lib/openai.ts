import OpenAI from "openai";

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export interface SummarizeResult {
  summary: string;
  topics: string[];
}

export interface ClassifyResult {
  topics: Array<{
    name: string;
    confidence: number;
  }>;
}

/**
 * Summarize a highlight and extract key topics
 */
export async function summarizeHighlight(
  content: string,
  note?: string | null
): Promise<SummarizeResult> {
  const prompt = `다음은 책에서 발췌한 하이라이트입니다. 이 내용을 1-2문장으로 요약하고, 관련된 주제 키워드를 3-5개 추출해주세요.

하이라이트:
"${content}"

${note ? `사용자 메모: "${note}"` : ""}

JSON 형식으로 응답해주세요:
{
  "summary": "요약 내용",
  "topics": ["주제1", "주제2", "주제3"]
}`;

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "당신은 책의 핵심 내용을 요약하고 주제를 분류하는 AI 어시스턴트입니다. 항상 유효한 JSON으로 응답하세요.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  
  return {
    summary: result.summary || "",
    topics: result.topics || [],
  };
}

/**
 * Classify multiple highlights into topics
 */
export async function classifyHighlights(
  highlights: Array<{ id: string; content: string; note?: string | null }>
): Promise<Map<string, ClassifyResult>> {
  const highlightTexts = highlights
    .map((h, i) => `[${i + 1}] "${h.content}"${h.note ? ` (메모: ${h.note})` : ""}`)
    .join("\n\n");

  const prompt = `다음 하이라이트들을 분석하고 각각에 대해 관련 주제를 분류해주세요.

${highlightTexts}

각 하이라이트에 대해 1-3개의 주제와 신뢰도(0-1)를 JSON 형식으로 응답해주세요:
{
  "classifications": [
    {
      "index": 1,
      "topics": [
        {"name": "주제명", "confidence": 0.9}
      ]
    }
  ]
}`;

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "당신은 텍스트를 주제별로 분류하는 AI 어시스턴트입니다. 항상 유효한 JSON으로 응답하세요.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  const classificationMap = new Map<string, ClassifyResult>();

  if (result.classifications) {
    for (const classification of result.classifications) {
      const highlightIndex = classification.index - 1;
      if (highlights[highlightIndex]) {
        classificationMap.set(highlights[highlightIndex].id, {
          topics: classification.topics || [],
        });
      }
    }
  }

  return classificationMap;
}

/**
 * Generate embeddings for semantic search
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Answer questions based on user's highlights
 */
export async function answerFromHighlights(
  question: string,
  relevantHighlights: Array<{ content: string; note?: string | null; bookTitle: string }>
): Promise<string> {
  const context = relevantHighlights
    .map((h, i) => `[${i + 1}] 책: "${h.bookTitle}"\n내용: "${h.content}"${h.note ? `\n메모: "${h.note}"` : ""}`)
    .join("\n\n");

  const prompt = `사용자가 읽은 책들의 하이라이트를 바탕으로 질문에 답변해주세요.

관련 하이라이트:
${context}

질문: ${question}

위 하이라이트 내용을 참고하여 답변해주세요. 답변 시 어떤 책에서 온 내용인지 언급해주세요.`;

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "당신은 사용자가 읽은 책의 내용을 바탕으로 질문에 답변하는 지식 비서입니다. 친절하고 정확하게 답변하세요.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.5,
  });

  return response.choices[0].message.content || "답변을 생성할 수 없습니다.";
}
