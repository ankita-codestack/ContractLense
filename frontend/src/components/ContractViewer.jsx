
import { useEffect, useState } from "react";
import "./ContractViewer.css";

export default function ContractViewer({
  clauses = [],
  activeClauseId,
  onSelectClause,
}) {
  const [localActiveId, setLocalActiveId] = useState(
    clauses[0]?.id ?? null
  );

  const isControlled = activeClauseId !== undefined;

  const selectedId = isControlled
    ? activeClauseId
    : localActiveId;

  useEffect(() => {
    if (!clauses.length) {
      setLocalActiveId(null);
      return;
    }

    const selectionExists = clauses.some(
      (clause) => clause.id === selectedId
    );

    if (!selectionExists) {
      const firstId = clauses[0].id;
      setLocalActiveId(firstId);
      onSelectClause?.(firstId);
    }
  }, [clauses, selectedId, onSelectClause]);

  const active =
    clauses.find((clause) => clause.id === selectedId) ??
    clauses[0] ??
    null;

  function selectClause(id) {
    setLocalActiveId(id);
    onSelectClause?.(id);
  }

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
        <span className="eyebrow-mono">
          CLAUSES ({clauses.length})
        </span>

        <ul>
          {clauses.map((clause, index) => (
            <li key={clause.id ?? index}>
              <button
                type="button"
                className={`viewer-list-item ${
                  active?.id === clause.id
                    ? "viewer-list-item--active"
                    : ""
                }`}
                onClick={() => selectClause(clause.id)}
              >
                <span className="viewer-list-title">
                  {clause.title || `Clause ${index + 1}`}
                </span>

                {clause.riskLevel && (
                  <span
                    className={`viewer-tag viewer-tag--${String(
                      clause.riskLevel
                    ).toLowerCase()}`}
                  >
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
            <span className="eyebrow-mono">
              {active.section || "CLAUSE"}
            </span>

            <h3 className="viewer-detail-title">
              {active.title || "Untitled clause"}
            </h3>

            <p className="viewer-detail-summary">
              {active.summary || "No summary available for this clause."}
            </p>

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
