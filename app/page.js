"use client";

import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Olá. Sou o Agente IA REURB. Como posso ajudar?"
    }
  ]);

  const [input, setInput] = useState("");

  const [
    previousResponseId,
    setPreviousResponseId
  ] = useState(null);

  const [loading, setLoading] = useState(false);

  async function ask() {
    const message = String(input || "").trim();

    if (!message || loading) return;

    setMessages((current) => [
      ...current,
      {
        role: "user",
        text: message
      }
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        cache: "no-store",

        body: JSON.stringify({
          message,
          previousResponseId
        })
      });

      const raw = await response.text();

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        console.error("INVALID_API_RESPONSE", {
          status: response.status,
          contentType:
            response.headers.get("content-type"),
          raw
        });

        throw new Error(
          `O servidor retornou uma resposta inválida (${response.status}). ` +
            `Resposta recebida: ${raw.slice(0, 700)}`
        );
      }

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            `Erro HTTP ${response.status} ao consultar o agente.`
        );
      }

      setPreviousResponseId(
        data.responseId || null
      );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data.answer
        }
      ]);
    } catch (error) {
      console.error(
        "CHAT_FRONTEND_ERROR",
        error
      );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text:
            `Erro ao consultar o agente:\n\n${error.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setPreviousResponseId(null);

    setMessages([
      {
        role: "assistant",
        text:
          "Nova consulta iniciada. Como posso ajudar?"
      }
    ]);
  }

  return (
    <main>
      <header>
        <h1>Agente IA REURB</h1>

        <div className="small">
          Procedimentos • Jurídico • Etapas • Registro • Modelos
        </div>
      </header>

      <section className="card">
        <div
          className="row"
          style={{
            justifyContent: "space-between",
            marginBottom: 16
          }}
        >
          <strong>
            Consulta técnica e jurídica
          </strong>

          <button
            type="button"
            onClick={newConversation}
            disabled={loading}
          >
            Nova conversa
          </button>
        </div>

        <div className="chat">
          {messages.map(
            (message, index) => (
              <div
                key={index}
                className={`msg ${
                  message.role === "user"
                    ? "user"
                    : "ai"
                }`}
              >
                {message.text}
              </div>
            )
          )}

          {loading && (
            <div className="msg ai">
              Consultando…
            </div>
          )}
        </div>

        <form
          className="chat-form"
          onSubmit={(event) => {
            event.preventDefault();
            ask();
          }}
        >
          <textarea
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            placeholder="Digite sua dúvida sobre REURB..."
            disabled={loading}
          />

          <button
            type="submit"
            disabled={
              loading || !input.trim()
            }
          >
            {loading
              ? "Consultando…"
              : "Enviar"}
          </button>
        </form>
      </section>
    </main>
  );
}
