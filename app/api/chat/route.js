import { NextResponse } from "next/server";
import { openaiClient } from "../../../lib/openai";
import { SYSTEM_PROMPT } from "../../../lib/systemPrompt";

export const runtime = "nodejs";
export const maxDuration = 60;

function extractSources(response) {
  const sources = [];
  const seen = new Set();

  try {
    for (const item of response.output || []) {
      if (item.type !== "message") continue;

      for (const content of item.content || []) {
        const annotations = content.annotations || [];

        for (const annotation of annotations) {
          if (annotation.type !== "file_citation") continue;

          const fileId = annotation.file_id || null;
          const filename =
            annotation.filename ||
            annotation.file_name ||
            "Documento da base";

          const key = `${fileId || ""}:${filename}`;

          if (!seen.has(key)) {
            seen.add(key);
            sources.push({
              fileId,
              filename
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("SOURCE_EXTRACTION_ERROR", error);
  }

  return sources;
}

export async function POST(request) {
  try {
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "O corpo da requisição não é um JSON válido."
        },
        { status: 400 }
      );
    }

    const message = String(body?.message || "").trim();
    const previousResponseId =
      body?.previousResponseId &&
      typeof body.previousResponseId === "string"
        ? body.previousResponseId
        : undefined;

    if (!message) {
      return NextResponse.json(
        {
          ok: false,
          error: "Digite uma pergunta."
        },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: "OPENAI_API_KEY não configurada na Vercel."
        },
        { status: 500 }
      );
    }

    const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

    if (!vectorStoreId) {
      return NextResponse.json(
        {
          ok: false,
          error: "OPENAI_VECTOR_STORE_ID não configurado na Vercel."
        },
        { status: 500 }
      );
    }

    const model = process.env.OPENAI_MODEL || "gpt-5";

    const openai = openaiClient();

    const payload = {
      model,
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

    console.log("REURB_REQUEST", {
      model,
      vectorStoreId,
      hasPreviousResponse: Boolean(previousResponseId),
      messageLength: message.length
    });

    const response = await openai.responses.create(payload);

    console.log("REURB_RESPONSE_OK", {
      responseId: response.id,
      outputItems: response.output?.length || 0
    });

    const answer =
      response.output_text?.trim() ||
      "A OpenAI respondeu, mas não retornou conteúdo textual.";

    const sources = extractSources(response);

    return NextResponse.json(
      {
        ok: true,
        answer,
        responseId: response.id,
        sources
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("REURB_CHAT_ERROR", {
      name: error?.name,
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
      stack: error?.stack
    });

    let message = "Erro interno ao consultar o agente.";

    if (error?.status === 401) {
      message =
        "A OpenAI recusou a API Key. Confira OPENAI_API_KEY na Vercel.";
    } else if (error?.status === 404) {
      message =
        "A OpenAI não encontrou o modelo ou Vector Store configurado. Confira OPENAI_MODEL e OPENAI_VECTOR_STORE_ID.";
    } else if (error?.status === 429) {
      message =
        "A OpenAI recusou temporariamente a consulta por limite de uso ou créditos. Confira Billing e Limits na OpenAI.";
    } else if (error?.message) {
      message = error.message;
    }

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      {
        status: error?.status || 500,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
