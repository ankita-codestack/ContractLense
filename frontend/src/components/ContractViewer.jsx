import { useState } from "react";
import "./ContractViewer.css";

export default function ContractViewer({ clauses = [] }) {
  const [activeId, setActiveId] = useState(clauses?.[0]?.id ?? null);
  const active = clauses.find((c) => c.id === activeId) ?? clauses[0] ?? null;
  if (!clauses.length) {
    return (
      <div className="viewer-empty">
        <span className="eyebrow-mono">NO CLAUSES YET</span>
        <p>Clause extraction hasn't returned anything to show.</p>
      </div>
    );
  }

  return (
    <div className="viewer">
      <aside className="viewer-list">
        <span className="eyebrow-mono">CLAUSES ({clauses.length})</span>
        <ul>
          {clauses.map((clause) => (
            <li key={clause.id}>
              <button
                className={`viewer-list-item ${
                  active?.id === clause.id ? "viewer-list-item--active" : ""
                }`}
                onClick={() => setActiveId(clause.id)}
              >
                <span className="viewer-list-title">{clause.title}</span>
                {clause.riskLevel && (
                  <span className={`viewer-tag viewer-tag--${clause.riskLevel}`}>
                    {clause.riskLevel}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="viewer-detail">
        {active && (
          <>
            <span className="eyebrow-mono">{active.section ?? "CLAUSE"}</span>
            <h3 className="viewer-detail-title">{active.title}</h3>
            <p className="viewer-detail-summary">{active.summary}</p>

            {active.sourceText && (
              <blockquote className="viewer-source">
                <span className="eyebrow-mono">SOURCE TEXT</span>
                <p>{active.sourceText}</p>
              </blockquote>
            )}

            {active.parties?.length > 0 && (
              <div className="viewer-meta">
                <span className="eyebrow-mono">PARTIES</span>
                <p>{active.parties.join(", ")}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}