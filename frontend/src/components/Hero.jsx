import "./Hero.css";

export default function Hero({ onAnalyze, onHowItWorks }) {
  return (
    <section className="hero">
      <p className="eyebrow-mono">AI-powered contract review</p>
      <h1 className="hero-title">
        Read the fine print<br />before it reads you.
      </h1>
      <p className="hero-subtitle">
        Upload any contract. ContractLens flags the risky clauses, builds a
        deadline timeline, and answers your questions — with the exact clause
        cited every time.
      </p>
      <div className="hero-actions">
        <button className="hero-btn hero-btn--primary" onClick={onAnalyze}>
          Analyze a contract
        </button>
        <button className="hero-btn hero-btn--secondary" onClick={onHowItWorks}>
          How it works
        </button>
      </div>
    </section>
  );
}