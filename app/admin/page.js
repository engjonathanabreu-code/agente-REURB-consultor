"use client";

import { useState } from "react";

export default function Admin() {
  const [token, setToken] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function test() {
    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await fetch("/api/status", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha.");

      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <header>
        <h1>Diagnóstico do Agente REURB</h1>
        <div className="small">
          Confirme a conexão entre Vercel, OpenAI e Vector Store.
        </div>
      </header>

      <section className="card">
        <p>
          <label><strong>ADMIN_TOKEN</strong></label>
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Informe o token configurado na Vercel"
        />

        <p>
          <button onClick={test} disabled={loading}>
            {loading ? "Testando…" : "Testar conexão"}
          </button>
        </p>

        {error && <p className="status-bad">Erro: {error}</p>}

        {data && (
          <div>
            <p className="status-ok">Conexão OK</p>
            <p><strong>Vector Store:</strong> {data.vectorStore.name || "(sem nome)"}</p>
            <p><strong>ID:</strong> <code>{data.vectorStore.id}</code></p>
            <p><strong>Status:</strong> {data.vectorStore.status}</p>
            <p><strong>Modelo:</strong> {data.model}</p>
            <p>
              <strong>Arquivos:</strong>{" "}
              {data.vectorStore.fileCounts?.completed ?? 0} concluídos /{" "}
              {data.vectorStore.fileCounts?.total ?? 0} total
            </p>
            <p>
              <strong>Em processamento:</strong>{" "}
              {data.vectorStore.fileCounts?.in_progress ?? 0}
            </p>
            <p>
              <strong>Falharam:</strong>{" "}
              {data.vectorStore.fileCounts?.failed ?? 0}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
