import UploadWorkspace from "./UploadWorkspace.jsx";
import AnalysisFlow from "./AnalysisFlow.jsx";
import { useEffect, useState } from "react";
import ContractViewer from "./ContractViewer.jsx";
import RiskPanel from "./RiskPanel.jsx";
import Timeline from "./Timeline.jsx";
import QAPanel from "./QAPanel.jsx";
import "./Dashboard.css";

const SECTION_IDS = [
  "overview",
  "contract-summary",
  "risk-analysis",
  "key-clauses",
  "contract-timeline",
];

export default function Dashboard({
  contract,
  onFileReady,
  isAnalyzing,
  fileName,
  analysisError,
}) {
  const [qaHistory, setQaHistory] = useState(contract?.qaSeed || []);
  const [qaLoading, setQaLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeClauseId, setActiveClauseId] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");

  const hasContractData = Boolean(
    contract &&
      (contract.text || contract.fileName || contract.clauses?.length)
  );

  useEffect(() => {
    setQaHistory(contract?.qaSeed || []);
  }, [contract?.fileName, contract?.text, contract?.qaSeed]);

  useEffect(() => {
    const sections = SECTION_IDS
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top
          );

        if (visibleSections.length > 0) {
          setActiveSection(visibleSections[0].target.id);
        }
      },
      {
        rootMargin: "-15% 0px -70% 0px",
        threshold: 0,
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [hasContractData]);

  async function handleAsk(question) {
    if (!contract?.text || !question.trim() || qaLoading) return;

    const currentQuestion = question.trim();
    const answerIndex = qaHistory.length;

    let fullAnswer = "";
    setQaLoading(true);

    setQaHistory((prev) => [
      ...prev,
      {
        question: currentQuestion,
        answer: "",
        clauseRef: null,
      },
    ]);

    try {
      const response = await fetch(
        "http://localhost:5000/api/contracts/qa",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contractText: contract.text.slice(0, 24000),
            question: currentQuestion,
          }),
        }
      );

      if (!response.ok || !response.body) {
        let message = "Failed to answer question.";

        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          // The server may return a plain-text error.
        }

        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        fullAnswer += decoder.decode(value, { stream: true });

        setQaHistory((prev) =>
          prev.map((item, index) =>
            index === answerIndex
              ? { ...item, answer: fullAnswer }
              : item
          )
        );
      }

      fullAnswer += decoder.decode();

      setQaHistory((prev) =>
        prev.map((item, index) =>
          index === answerIndex
            ? {
                ...item,
                answer: fullAnswer || "No answer received.",
              }
            : item
        )
      );
    } catch (error) {
      console.error("Q&A error:", error);

      setQaHistory((prev) =>
        prev.map((item, index) =>
          index === answerIndex
            ? {
                ...item,
                answer:
                  fullAnswer || `Unable to answer: ${error.message}`,
              }
            : item
        )
      );
    } finally {
      setQaLoading(false);
    }
  }

  function navigateTo(id) {
    const section = document.getElementById(id);

    if (!section) return;

    setActiveSection(id);

    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function openAssistant() {
    setIsChatOpen(true);
  }

  const parties = contract?.parties || [];
  const financialTerms = contract?.financialTerms || [];
  const clauses = contract?.clauses || [];
  const risks = contract?.risks || [];

  const timelineEvents = (contract?.timeline || []).map((item) => ({
    date: item.date,
    title: item.label,
    severity:
      item.type === "notice" || item.type === "renewal"
        ? "review-worthy"
        : "standard",
  }));

  const highRisks = risks.filter(
    (risk) => risk.level === "high"
  ).length;

  const reviewRisks = risks.filter(
    (risk) => risk.level === "review"
  ).length;

  const filteredClauses = clauses.filter((clause) =>
    `${clause.title || ""} ${clause.summary || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <button
          type="button"
          className="sidebar-brand"
          onClick={() => navigateTo("overview")}
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
            type="button"
            className={`sidebar-link ${
              activeSection === "overview" ? "sidebar-link--active" : ""
            }`}
            onClick={() => navigateTo("overview")}
          >
            <span>▦</span> Dashboard
          </button>

          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "contract-summary"
                ? "sidebar-link--active"
                : ""
            }`}
            onClick={() => navigateTo("contract-summary")}
          >
            <span>▤</span> Contract details
          </button>

          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "risk-analysis"
                ? "sidebar-link--active"
                : ""
            }`}
            onClick={() => navigateTo("risk-analysis")}
          >
            <span>◇</span> Risk analysis
          </button>

          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "key-clauses"
                ? "sidebar-link--active"
                : ""
            }`}
            onClick={() => navigateTo("key-clauses")}
          >
            <span>≡</span> Key clauses
          </button>

          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "contract-timeline"
                ? "sidebar-link--active"
                : ""
            }`}
            onClick={() => navigateTo("contract-timeline")}
          >
            <span>◷</span> Timeline
          </button>

          <button
            type="button"
            className={`sidebar-link ${
              isChatOpen ? "sidebar-link--active" : ""
            }`}
            onClick={openAssistant}
          >
            <span>✳</span> Q&A assistant
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help-mark">?</div>
          <div>
            <strong>Need a closer look?</strong>
            <p>Ask questions about your agreement.</p>
            <button type="button" onClick={openAssistant}>
              Open assistant →
            </button>
          </div>
        </div>

        <div className="sidebar-version">
          CONTRACTLENS · WORKSPACE
        </div>
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
                Understand your agreement, identify risks, and stay
                ahead of important deadlines.
              </p>
            </div>

            <div className="dashboard-status">
              <span className="status-dot" />
              Analysis available
            </div>
          </section>

          <section className="dashboard-upload-section" id="upload-contract">
            <div className="dashboard-panel-heading">
              <div>
                <p className="dashboard-overline">CONTRACT WORKSPACE</p>
                <h2>Upload a contract</h2>
                <p className="dashboard-panel-description">
                  Select a PDF to extract clauses, review risks, and
                  identify key dates.
                </p>
              </div>
            </div>

            {analysisError && (
              <p className="dashboard-upload-error" role="alert">
                {analysisError}
              </p>
            )}

            {isAnalyzing ? (
              <AnalysisFlow fileName={fileName} onComplete={() => {}} />
            ) : (
              <UploadWorkspace onFileReady={onFileReady} />
            )}
          </section>

          {hasContractData && (
            <>
              <section className="dashboard-document-banner">
                <div className="document-icon" aria-hidden="true">
                  <span>PDF</span>
                  <i />
                  <i />
                  <i />
                </div>

                <div className="document-banner-info">
                  <p className="dashboard-overline">CURRENTLY REVIEWING</p>
                  <h2>{contract.fileName || "Untitled contract"}</h2>
                  <p>{contract.title || "Contract analysis"}</p>
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

              <section className="dashboard-content-grid" id="contract-summary">
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
                      <div
                        className="dashboard-party"
                        key={`${party.role}-${index}`}
                      >
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
                          <div
                            className="dashboard-term"
                            key={`${term.label}-${index}`}
                          >
                            <span>{term.label}</span>
                            <strong>{term.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="dashboard-clause-viewer">
                    <h3>Explore extracted clauses</h3>
                    <ContractViewer
                      clauses={filteredClauses}
                      activeClauseId={activeClauseId}
                      onSelectClause={setActiveClauseId}
                    />

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

                  <RiskPanel
                    risks={risks}
                    onSelectRisk={(risk) => {
                      const matchedClause = clauses.find(
                        (clause) =>
                          (risk.clauseId &&
                            clause.id === risk.clauseId) ||
                          (risk.clauseTitle &&
                            clause.title?.trim().toLowerCase() ===
                              risk.clauseTitle.trim().toLowerCase())
                      );

                      if (matchedClause) {
                        setSearch("");
                        setActiveClauseId(matchedClause.id);
                        setActiveSection("contract-summary");

                        document
                          .getElementById("contract-summary")
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                      }
                    }}
                  />
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
                        <div
                          className="key-clause-item"
                          key={clause.id || index}
                        >
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
            </>
          )}

          <footer className="dashboard-footer">
            <span>CONTRACTLENS</span>
            <span>Review carefully. Make informed decisions.</span>
          </footer>
        </div>
      </main>

      {hasContractData && (
        <div className="floating-qa">
          {isChatOpen && (
            <div className="floating-qa-window">
              <div className="floating-qa-header">
                <div>
                  <strong>ContractLens Assistant</strong>
                  <p>Ask about your contract</p>
                </div>

                <button
                  type="button"
                  className="floating-qa-close"
                  onClick={() => setIsChatOpen(false)}
                  aria-label="Close assistant"
                >
                  ×
                </button>
              </div>

              <QAPanel
                onAsk={handleAsk}
                history={qaHistory}
                loading={qaLoading}
              />
            </div>
          )}

          <button
            type="button"
            className="floating-qa-button"
            onClick={() => setIsChatOpen((open) => !open)}
          >
            {isChatOpen ? "×" : "✳ Ask AI"}
          </button>
        </div>
      )}
    </div>
  );
}