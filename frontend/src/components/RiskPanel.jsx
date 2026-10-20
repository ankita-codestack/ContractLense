import { useMemo, useState } from "react";
import "./RiskPanel.css";

const LEVELS = [
  { id: "high", label: "High risk" },
  { id: "review", label: "Needs review" },
  { id: "standard", label: "Standard" },
];

export default function RiskPanel({ risks = [] }) {
  const [filter, setFilter] = useState("all");

  const counts = useMemo(() => {
    const c = { high: 0, review: 0, standard: 0 };
    risks.forEach((r) => {
      if (c[r.level] !== undefined) c[r.level] += 1;
    });
    return c;
  }, [risks]);

  const visible = filter === "all" ? risks : risks.filter((r) => r.level === filter);

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
          className={`risk-filter ${filter === "all" ? "risk-filter--active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({risks.length})
        </button>
        {LEVELS.map((l) => (
          <button
            key={l.id}
            className={`risk-filter risk-filter--${l.id} ${
              filter === l.id ? "risk-filter--active" : ""
            }`}
            onClick={() => setFilter(l.id)}
          >
            {l.label} ({counts[l.id] ?? 0})
          </button>
        ))}
      </div>

      <ul className="risk-list">
        {visible.map((risk) => (
          <li key={risk.id} className={`risk-card risk-card--${risk.level}`}>
            <div className="risk-card-head">
              <span className={`risk-dot risk-dot--${risk.level}`} />
              <h4 className="risk-card-title">{risk.clauseTitle}</h4>
              <span className="risk-card-level eyebrow-mono">{risk.level}</span>
            </div>
            <p className="risk-card-reason">{risk.reason}</p>
            {risk.recommendation && (
              <p className="risk-card-rec">
                <strong>Suggested action — </strong>
                {risk.recommendation}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}