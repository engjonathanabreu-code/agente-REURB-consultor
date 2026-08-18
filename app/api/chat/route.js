import { NextResponse } from "next/server";
import { openaiClient } from "../../../lib/openai";
import { SYSTEM_PROMPT } from "../../../lib/systemPrompt";

export const runtime = "nodejs";
export const maxDuration = 60;

function getSources(response) {
  const sources = [];
  const seen = new Set();

  for (const item of response.output || []) {
    if (item.type !== "message") continue;

    for (const part of item.content || []) {
      for (const ann of part.annotations || []) {
        if (ann.type !== "file_citation") continue;

        const id = ann.file_id || "";
        const filename = ann.filename || "Documento da base";
        const key = `${id}:${filename}`;

        if (!seen.has(key)) {
          seen.add(key);
          sources.push({ fileId: id || null, filename });
        }
      }
    }
  }

  return sources;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const message = String(body.message || "").trim();
    const previousResponseId = body.previousResponseId || undefined;

    if (!message) {
      return NextResponse.json(
        { error: "Digite uma pergunta." },
        { status: 400 }
      );
    }

    const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;
    if (!vectorStoreId) {
      return NextResponse.json(
        { error: "OPENAI_VECTOR_STORE_ID não configurado." },
        { status: 500 }
      );
    }

    const openai = openaiClient();

    const payload = {
      model: process.env.OPENAI_MODEL || "gpt-5",
      instructions: SYSTEM_PROMPT,
      input: message,
      tools: [
        {
          type: "file_search",
          vector_store_ids: [vectorStoreId],
          max_num_results: 15
        }
      ],
      tool_choice: "auto"
    };

    if (previousResponseId) {
      payload.previous_response_id = previousResponseId;
    }

    const response = await openai.responses.create(payload);

    return NextResponse.json({
      ok: true,
      answer: response.output_text || "Não foi possível produzir a resposta.",
      responseId: response.id,
      sources: getSources(response)
    });
  } catch (error) {
    console.error("CHAT_ERROR", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Falha ao consultar a OpenAI. Confira API Key, Vector Store e modelo."
      },
      { status: 500 }
    );
  }
}
