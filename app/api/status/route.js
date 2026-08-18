import { NextResponse } from "next/server";
import { openaiClient } from "../../../lib/openai";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const expected = process.env.ADMIN_TOKEN;
    const auth = request.headers.get("authorization") || "";

    if (!expected || auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;
    if (!vectorStoreId) {
      return NextResponse.json(
        { error: "OPENAI_VECTOR_STORE_ID não configurado." },
        { status: 500 }
      );
    }

    const openai = openaiClient();
    const store = await openai.vectorStores.retrieve(vectorStoreId);

    return NextResponse.json({
      ok: true,
      vectorStore: {
        id: store.id,
        name: store.name,
        status: store.status,
        usageBytes: store.usage_bytes,
        fileCounts: store.file_counts
      },
      model: process.env.OPENAI_MODEL || "gpt-5"
    });
  } catch (error) {
    console.error("STATUS_ERROR", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Não foi possível acessar o Vector Store."
      },
      { status: 500 }
    );
  }
}
