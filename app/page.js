"use client";

import { useState } from "react";

const quickQuestions = [
  "Quais são as etapas da REURB desde a instauração até o registro?",
  "Quais documentos integram o projeto de regularização fundiária?",
  "Explique REURB-S e REURB-E e suas diferenças práticas.",
  "Quais são as etapas para emissão e registro da CRF?",
  "Crie um modelo de requerimento de instauração de REURB.",
  "Crie um checklist técnico-jurídico para uma REURB."
];

export default function Home() {
  const [messages, setMessages] =
    useState([
      {
        role: "assistant",
        text:
          "Olá. Sou o Agente IA REURB. Consulto a base documental cadastrada para responder dúvidas sobre procedimentos, legislação, registro e documentos, e também posso elaborar modelos fundamentados na base."
      }
    ]);

  const [input, setInput] =
    useState("");

  const [
    previousResponseId,
    setPreviousResponseId
  ] = useState(null);

  const [loading, setLoading] =
    useState(false);

  async function ask(value) {
    const message =
      String(value ?? input).trim();

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
      const response =
        await fetch("/api/chat", {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          cache: "no-store",

          body: JSON.stringify({
            message,
            previousResponseId
          })
        });

      const raw =
        await response.text();

      let data;

      try {
        data =
          JSON.parse(raw);
      } catch {
        console.error(
          "INVALID_API_RESPONSE",
          {
            status:
              response.status,

            contentType:
              response.headers.get(
                "content-type"
              ),

            raw
          }
        );

        throw new Error(
          `O servidor retornou uma resposta inválida (${response.status}). ` +
          `Resposta recebida: ${raw.slice(0, 700)}`
        );
      }

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.error ||
          `Erro HTTP ${response.status} ao consultar o agente.`
        );
      }

      setPreviousResponseId(
        data.responseId || null
      );

      setMessages(
        (current) => [
          ...current,
          {
            role: "assistant",

            text:
              data.answer,

            sources:
              Array.isArray(
                data.sources
              )
                ? data.sources
                : []
          }
        ]
      );
    } catch (error) {
      console.error(
        "CHAT_FRONTEND_ERROR",
        error
      );

      setMessages(
        (current) => [
          ...current,
          {
            role: "assistant",

            text:
              `Erro ao consultar o agente:\n\n${error.message}`
          }
        ]
      );
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
        <h1>
          Agente IA REURB
        </h1>

        <div className="small">
          Procedimentos • Jurídico •
          Etapas • Registro • Modelos
        </div>
      </header>

      <div className="notice">
        As respostas são produzidas
        com consulta à base documental
        cadastrada no Vector Store.
        Normas estaduais e municipais
        podem complementar as regras
        nacionais.
      </div>

      <div className="grid">
        {quickQuestions.map(
          (question) => (
            <button
              className="quick"
              key={question}
              type="button"
              disabled={loading}
              onClick={() =>
                ask(question)
              }
            >
              {question}
            </button>
          )
        )}
      </div>

      <section className="card">
        <div
          className="row"
          style={{
            justifyContent:
              "space-between",

            marginBottom: 16
          }}
        >
          <strong>
            Consulta técnica e jurídica
          </strong>

          <button
            type="button"
            onClick={
              newConversation
            }
            disabled={loading}
          >
            Nova conversa
          </button>
        </div>

        <div className="chat">
          {messages.map(
            (
              message,
              index
            ) => (
              <div
                key={index}

                className={`msg ${
                  message.role ===
                  "user"
                    ? "user"
                    : "ai"
                }`}
              >
                {message.text}

                {message.sources
                  ?.length > 0 && (
                  <div className="sources">
                    <strong>
                      Arquivos
                      utilizados:
                    </strong>

                    <br />

                    {message.sources.map(
                      (
                        source,
                        sourceIndex
                      ) => (
                        <span
                          key={`${
                            source.fileId ||
                            "file"
                          }-${sourceIndex}`}
                        >
                          {
                            source.filename
                          }

                          {sourceIndex <
                          message.sources
                            .length -
                            1
                            ? <br />
                            : null}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            )
          )}

          {loading && (
            <div className="msg ai">
              Consultando a base
              documental…
            </div>
          )}
        </div>

        <form
          className="chat-form"
          onSubmit={(
            event
          ) => {
            event.preventDefault();
            ask();
          }}
        >
          <textarea
            value={input}

            onChange={(
              event
            ) =>
              setInput(
                event.target.value
              )
            }

            placeholder="Ex.: Quais requisitos devem constar na CRF?"

            disabled={loading}
          />

          <button
            type="submit"

            disabled={
              loading ||
              !input.trim()
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
