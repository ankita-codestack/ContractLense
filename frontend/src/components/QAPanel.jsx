
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./QAPanel.css";

export default function QAPanel({ onAsk, history = [], loading = false }) {
  const [question, setQuestion] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    onAsk?.(trimmed);
    setQuestion("");
  }

  return (
    <div className="qa-panel">
      <p className="eyebrow-mono qa-panel-label">
        Ask about this contract
      </p>

      <div className="qa-history">
        {history.length === 0 && !loading && (
          <p className="qa-empty">
            Ask something like "What happens if I terminate early?" or
            "Which clauses changed between versions?"
          </p>
        )}

        {history.map((entry, idx) => (
          <div key={idx} className="qa-entry">
            <div className="qa-question">
              <span className="qa-role eyebrow-mono">You</span>
              <p>{entry.question}</p>
            </div>

            <div className="qa-answer">
              <span className="qa-role eyebrow-mono">ContractLens</span>

              <div className="qa-answer-content">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h3>{children}</h3>,
                    h2: ({ children }) => <h3>{children}</h3>,
                    h3: ({ children }) => <h4>{children}</h4>,
                    p: ({ children }) => <p>{children}</p>,
                    ul: ({ children }) => <ul>{children}</ul>,
                    ol: ({ children }) => <ol>{children}</ol>,
                    li: ({ children }) => <li>{children}</li>,
                    strong: ({ children }) => <strong>{children}</strong>,
                  }}
                >
                  {entry.answer || ""}
                </ReactMarkdown>
              </div>

              {entry.clauseRef && (
                <p className="qa-ref">
                  Source: {entry.clauseRef}
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="qa-entry qa-entry--loading">
            <span className="qa-role eyebrow-mono">ContractLens</span>
            <p className="qa-typing">Reading the clauses…</p>
          </div>
        )}
      </div>

      <form className="qa-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question…"
          disabled={loading}
        />

        <button type="submit" disabled={loading || !question.trim()}>
          Ask
        </button>
      </form>
    </div>
  );
}
