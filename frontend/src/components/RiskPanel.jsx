
import { useMemo, useState } from "react";
import "./RiskPanel.css";

const LEVELS = [
  { id: "high", label: "High risk" },
  { id: "review", label: "Needs review" },
  { id: "standard", label: "Standard" },
];

export default function RiskPanel({
  risks = [],
  onSelectRisk,
}) {
  const [filter, setFilter] = useState("all");

  const counts = useMemo(() => {
    const result = {
      high: 0,
      review: 0,
      standard: 0,
    };

    risks.forEach((risk) => {
      const level = String(risk.level || "").toLowerCase();

      if (result[level] !== undefined) {
        result[level] += 1;
      }
    });

    return result;
  }, [risks]);

  const visible =
    filter === "all"
      ? risks
      : risks.filter(
          (risk) => String(risk.level || "").toLowerCase() === filter
        );

  if (!risks.length) {
    return (
      <div className="risk-empty">
        <span className="eyebrow-mono">NO RISKS FLAGGED</span>
        <p>Nothing has come back from the risk flagger yet.</p>
      </div>
    );
  }

  return (
    <div className="risk-panel">
      <div className="risk-filters">
        <button
          type="button"
          className={`risk-filter ${
            filter === "all" ? "risk-filter--active" : ""
          }`}
          onClick={() => setFilter("all")}
        >
          All ({risks.length})
        </button>

        {LEVELS.map((level) => (
          <button
            type="button"
            key={level.id}
            className={`risk-filter risk-filter--${level.id} ${
              filter === level.id ? "risk-filter--active" : ""
            }`}
            onClick={() => setFilter(level.id)}
          >
            {level.label} ({counts[level.id]})
          </button>
        ))}
      </div>

      <ul className="risk-list">
        {visible.map((risk, index) => (
          <li
            key={risk.id ?? `${risk.clauseTitle}-${index}`}
            className={`risk-card risk-card--${String(
              risk.level || "standard"
            ).toLowerCase()}`}
          >
            <button
              type="button"
              className="risk-card-select"
              onClick={() => onSelectRisk?.(risk)}
              aria-label={`View clause: ${risk.clauseTitle || "Related clause"}`}
            >
              <div className="risk-card-head">
                <span
                  className={`risk-dot risk-dot--${String(
                    risk.level || "standard"
                  ).toLowerCase()}`}
                />

                <h4 className="risk-card-title">
                  {risk.clauseTitle || "Untitled clause"}
                </h4>

                <span className="risk-card-level eyebrow-mono">
                  {risk.level || "standard"}
                </span>
              </div>

              <p className="risk-card-reason">
                {risk.reason || "No additional explanation provided."}
              </p>

              {risk.recommendation && (
                <p className="risk-card-rec">
                  <strong>Suggested action — </strong>
                  {risk.recommendation}
                </p>
              )}

              <span className="risk-card-open">
                View related clause ↗
              </span>
            </button>
          </li>
        ))}

        {visible.length === 0 && (
          <li className="risk-empty">
            <p>No risks found for this filter.</p>
          </li>
        )}
      </ul>
    </div>
  );
}
