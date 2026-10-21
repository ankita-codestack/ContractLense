import { useEffect, useState } from "react";
import ContractViewer from "./ContractViewer.jsx";
import RiskPanel from "./RiskPanel.jsx";
import Timeline from "./Timeline.jsx";
import QAPanel from "./QAPanel.jsx";
import "./Dashboard.css";

export default function Dashboard({ contract }) {
  const [qaHistory, setQaHistory] = useState(contract.qaSeed || []);
  const [qaLoading, setQaLoading] = useState(false);
  const [activeClauseId, setActiveClauseId] = useState(null);

    useEffect(() => {
    setQaHistory(contract.qaSeed || []);
  }, [contract.fileName, contract.text]);

  
async function handleAsk(question) {
  setQaLoading(true);

  try {
    const response = await fetch(
      "http://localhost:5000/api/contracts/qa",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractText: (contract.text || "").slice(0, 24000),
          question,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to answer question.");
    }

    setQaHistory((prev) => [
      ...prev,
      {
        question,
        answer: data.answer,
        clauseRef: data.clauseRef || null,
      },
    ]);
  } catch (error) {
    console.error("Q&A error:", error);

    setQaHistory((prev) => [
      ...prev,
      {
        question,
        answer: `Unable to answer: ${error.message}`,
        clauseRef: null,
      },
    ]);
  } finally {
    setQaLoading(false);
  }
}


  const timelineEvents = (contract.timeline || []).map((t) => ({
    date: t.date,
    title: t.label,
    severity:
      t.type === "notice" || t.type === "renewal" ? "review-worthy" : "standard",
  }));

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow-mono">{contract.title}</p>
          <h2 className="dashboard-filename">{contract.fileName}</h2>
        </div>
        <div className="dashboard-parties">
          {contract.parties?.map((p, idx) => (
            <span key={idx} className="dashboard-party">
              <span className="dashboard-party-role eyebrow-mono">{p.role}</span>
              {p.name}
            </span>
          ))}
        </div>
      </header>

      <div className="dashboard-financials">
        {contract.financialTerms?.map((f, idx) => (
          <div key={idx} className="dashboard-financial-item">
            <span className="dashboard-financial-label eyebrow-mono">{f.label}</span>
            <span className="dashboard-financial-value">{f.value}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-col dashboard-col--wide">
          <ContractViewer
            clauses={contract.clauses}
            activeClauseId={activeClauseId}
            onSelectClause={setActiveClauseId}
          />
        </div>

        <div className="dashboard-col">
          <RiskPanel
            risks={contract.risks}
            onSelectRisk={(risk) => setActiveClauseId(risk?.clauseId)}
          />
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid--bottom">
        <div className="dashboard-col">
          <p className="eyebrow-mono dashboard-section-label">Key dates</p>
          <Timeline events={timelineEvents} />
        </div>

        <div className="dashboard-col">
          <QAPanel onAsk={handleAsk} history={qaHistory} loading={qaLoading} />
        </div>
      </div>
    </div>
  );
}