"use client";

import { useState } from "react";

const quickQuestions = [
  "Quais são as etapas da REURB desde a instauração até o registro?",
  "Quais documentos integram o projeto de regularização fundiária?",
  "Explique REURB-S e REURB-E e suas diferenças práticas.",
  "Quais são as etapas para emissão e registro da CRF?",
  "Crie um modelo de requerimento de instauração de REURB.",
  "Crie um checklist técnico para elaboração de um projeto de REURB."
];

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Olá. Sou o Agente IA REURB. Consulto a base documental cadastrada para responder dúvidas sobre procedimentos, etapas e documentos, e posso elaborar modelos quando houver fundamento na base."
    }
  ]);
  const [input, setInput] = useState("");
  const [previousResponseId, setPreviousResponseId] = useState(null);
  const [loading, setLoading] = useState(false);

  async function ask(value) {
    const message = String(value ?? input).trim();
    if (!message || loading) return;

    setMessages((m) => [...m, { role: "user", text: message }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, previousResponseId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro na consulta.");
      }

      setPreviousResponseId(data.responseId || null);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.answer,
          sources: data.sources || []
        }
      ]);
    } catch (error) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Erro: ${error.message}` }
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
          "Nova consulta iniciada. O que você precisa saber sobre REURB?"
      }
    ]);
  }

  return (
    <main>
      <header>
        <h1>Agente IA REURB</h1>
        <div className="small">
          Procedimentos • Etapas • Base legal • Registro • Modelos de documentos
        </div>
      </header>

      <div className="notice">
        As respostas são produzidas a partir dos documentos cadastrados no Vector Store.
        Normas locais podem complementar as regras nacionais.
      </div>

      <div className="grid">
        {quickQuestions.map((q) => (
          <button
            className="quick"
            key={q}
            disabled={loading}
            onClick={() => ask(q)}
          >
            {q}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
          <strong>Consulta técnica</strong>
          <button type="button" onClick={newConversation}>
            Nova conversa
          </button>
        </div>

        <div className="chat">
          {messages.map((m, index) => (
            <div
              className={`msg ${m.role === "user" ? "user" : "ai"}`}
              key={index}
            >
              {m.text}

              {m.sources?.length > 0 && (
                <div className="sources">
                  <strong>Arquivos consultados:</strong>
                  <br />
                  {m.sources.map((s, i) => (
                    <span key={`${s.fileId}-${i}`}>
                      {s.filename}
                      {i < m.sources.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="msg ai">Consultando a base documental…</div>
          )}
        </div>

        <form
          className="chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex.: O que precisa constar na CRF?"
          />
          <button disabled={loading} type="submit">
            Enviar
          </button>
        </form>
      </section>
    </main>
  );
}
