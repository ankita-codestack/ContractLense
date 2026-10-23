
import { useEffect, useState } from "react";
import ContractViewer from "./ContractViewer.jsx";
import RiskPanel from "./RiskPanel.jsx";
import Timeline from "./Timeline.jsx";
import QAPanel from "./QAPanel.jsx";
import "./Dashboard.css";

export default function Dashboard({ contract }) {
  const [qaHistory, setQaHistory] = useState(contract.qaSeed || []);
  const [qaLoading, setQaLoading] = useState(false);
  const [search, setSearch] = useState("");

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

  function navigateTo(id) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const parties = contract.parties || [];
  const financialTerms = contract.financialTerms || [];
  const clauses = contract.clauses || [];
  const risks = contract.risks || [];

  const timelineEvents = (contract.timeline || []).map((item) => ({
    date: item.date,
    title: item.label,
    severity:
      item.type === "notice" || item.type === "renewal"
        ? "review-worthy"
        : "standard",
  }));

  const highRisks = risks.filter((risk) => risk.level === "high").length;
  const reviewRisks = risks.filter((risk) => risk.level === "review").length;

  const filteredClauses = clauses.filter((clause) =>
    `${clause.title || ""} ${clause.summary || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <button
          className="sidebar-brand"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <span className="sidebar-brand-mark">C</span>
          <span>
            Contract<span>Lens</span>
            <small>INTELLIGENCE PLATFORM</small>
          </span>
        </button>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          <button
            className="sidebar-link sidebar-link--active"
            onClick={() => navigateTo("overview")}
          >
            <span>▦</span> Dashboard
          </button>
          <button
            className="sidebar-link"
            onClick={() => navigateTo("contract-summary")}
          >
            <span>▤</span> Contract details
          </button>
          <button
            className="sidebar-link"
            onClick={() => navigateTo("risk-analysis")}
          >
            <span>◇</span> Risk analysis
          </button>
          <button
            className="sidebar-link"
            onClick={() => navigateTo("key-clauses")}
          >
            <span>≡</span> Key clauses
          </button>
          <button
            className="sidebar-link"
            onClick={() => navigateTo("contract-timeline")}
          >
            <span>◷</span> Timeline
          </button>
          <button
            className="sidebar-link"
            onClick={() => navigateTo("contract-qa")}
          >
            <span>✳</span> Q&A assistant
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help-mark">?</div>
          <div>
            <strong>Need a closer look?</strong>
            <p>Ask questions about your agreement.</p>
            <button onClick={() => navigateTo("contract-qa")}>
              Open assistant →
            </button>
          </div>
        </div>

        <div className="sidebar-version">CONTRACTLENS · WORKSPACE</div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-breadcrumb">
            Workspace <span>/</span> Contract overview
          </div>

          <div className="topbar-actions">
            <label className="dashboard-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search clauses..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search contract clauses"
              />
              <kbd>⌘ K</kbd>
            </label>

            <div className="topbar-avatar" title="ContractLens workspace">
              CL
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome" id="overview">
            <div>
              <p className="dashboard-overline">CONTRACT INTELLIGENCE</p>
              <h1>Contract overview</h1>
              <p className="dashboard-welcome-copy">
                Understand your agreement, identify risks, and stay ahead of
                important deadlines.
              </p>
            </div>

            <div className="dashboard-status">
              <span className="status-dot" />
              Analysis available
            </div>
          </section>

          <section className="dashboard-document-banner">
            <div className="document-icon" aria-hidden="true">
              <span>PDF</span>
              <i />
              <i />
              <i />
            </div>

            <div className="document-banner-info">
              <p className="dashboard-overline">
                CURRENTLY REVIEWING
              </p>
              <h2>{contract.fileName || "Untitled contract"}</h2>
              <p>
                {contract.title || "Contract analysis"}
              </p>
            </div>

            <div className="document-banner-meta">
              <span className="document-meta-label">PARTIES</span>
              <strong>{parties.length || "—"}</strong>
              <span className="document-meta-label">CLAUSES</span>
              <strong>{clauses.length}</strong>
            </div>
          </section>

          <section className="dashboard-stat-grid" aria-label="Contract metrics">
            <article className="dashboard-stat-card">
              <span className="stat-icon stat-icon--blue">▤</span>
              <p>Total clauses</p>
              <strong>{clauses.length}</strong>
              <span className="stat-footnote">Extracted from document</span>
            </article>

            <article className="dashboard-stat-card">
              <span className="stat-icon stat-icon--red">◇</span>
              <p>High risks</p>
              <strong>{highRisks}</strong>
              <span className="stat-footnote">Require close attention</span>
            </article>

            <article className="dashboard-stat-card">
              <span className="stat-icon stat-icon--sand">◎</span>
              <p>Needs review</p>
              <strong>{reviewRisks}</strong>
              <span className="stat-footnote">Clauses to examine</span>
            </article>

            <article className="dashboard-stat-card">
              <span className="stat-icon stat-icon--teal">◷</span>
              <p>Key dates</p>
              <strong>{timelineEvents.length}</strong>
              <span className="stat-footnote">Deadlines and milestones</span>
            </article>
          </section>

          <section
            className="dashboard-content-grid"
            id="contract-summary"
          >
            <article className="dashboard-panel dashboard-summary-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <p className="dashboard-overline">DOCUMENT BREAKDOWN</p>
                  <h2>Contract summary</h2>
                </div>
                <span className="panel-number">01</span>
              </div>

              <div className="dashboard-parties">
                {parties.map((party, index) => (
                  <div className="dashboard-party" key={`${party.role}-${index}`}>
                    <span className="dashboard-party-role">
                      {party.role}
                    </span>
                    <strong>{party.name}</strong>
                  </div>
                ))}
              </div>

              {financialTerms.length > 0 && (
                <div className="dashboard-terms">
                  <h3>Financial terms</h3>
                  <div className="dashboard-terms-grid">
                    {financialTerms.map((term, index) => (
                      <div className="dashboard-term" key={`${term.label}-${index}`}>
                        <span>{term.label}</span>
                        <strong>{term.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="dashboard-clause-viewer">
                <h3>Explore extracted clauses</h3>
                <ContractViewer clauses={filteredClauses} />
                {search && filteredClauses.length === 0 && (
                  <p className="dashboard-no-results">
                    No clauses match “{search}”.
                  </p>
                )}
              </div>
            </article>

            <article
              className="dashboard-panel dashboard-risk-panel"
              id="risk-analysis"
            >
              <div className="dashboard-panel-heading">
                <div>
                  <p className="dashboard-overline">REVIEW PRIORITIES</p>
                  <h2>Risk analysis</h2>
                </div>
                <span className="panel-number">02</span>
              </div>

              <div className="risk-summary-strip">
                <div>
                  <span className="risk-summary-dot risk-summary-dot--high" />
                  <span>High risk</span>
                  <strong>{highRisks}</strong>
                </div>
                <div>
                  <span className="risk-summary-dot risk-summary-dot--review" />
                  <span>Needs review</span>
                  <strong>{reviewRisks}</strong>
                </div>
              </div>

              <RiskPanel risks={risks} />
            </article>
          </section>

          <section className="dashboard-content-grid dashboard-content-grid--lower">
            <article
              className="dashboard-panel dashboard-key-clauses"
              id="key-clauses"
            >
              <div className="dashboard-panel-heading">
                <div>
                  <p className="dashboard-overline">IMPORTANT PROVISIONS</p>
                  <h2>Key clauses</h2>
                </div>
                <span className="panel-number">03</span>
              </div>

              {filteredClauses.length > 0 ? (
                <div className="key-clause-list">
                  {filteredClauses.slice(0, 5).map((clause, index) => (
                    <div className="key-clause-item" key={clause.id || index}>
                      <span className="key-clause-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3>{clause.title || "Untitled clause"}</h3>
                        <p>
                          {clause.summary || "No summary available."}
                        </p>
                      </div>
                      <span className="key-clause-arrow">↗</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="dashboard-empty-message">
                  No extracted clauses are available yet.
                </p>
              )}
            </article>

            <article
              className="dashboard-panel dashboard-timeline-panel"
              id="contract-timeline"
            >
              <div className="dashboard-panel-heading">
                <div>
                  <p className="dashboard-overline">DEADLINES & MILESTONES</p>
                  <h2>Contract timeline</h2>
                </div>
                <span className="panel-number">04</span>
              </div>

              <Timeline events={timelineEvents} />
            </article>
          </section>

          <section
            className="dashboard-panel dashboard-qa-section"
            id="contract-qa"
          >
            <div className="dashboard-panel-heading">
              <div>
                <p className="dashboard-overline">ASK YOUR CONTRACT</p>
                <h2>Q&A assistant</h2>
                <p className="dashboard-panel-description">
                  Ask questions about the agreement and review the AI-generated
                  answers.
                </p>
              </div>
              <span className="panel-number">05</span>
            </div>

            <QAPanel
              onAsk={handleAsk}
              history={qaHistory}
              loading={qaLoading}
            />
          </section>

          <footer className="dashboard-footer">
            <span>CONTRACTLENS</span>
            <span>Review carefully. Make informed decisions.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
