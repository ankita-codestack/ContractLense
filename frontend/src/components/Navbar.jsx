import "./Navbar.css";

export default function Navbar({ onHome, onAnalyze }) {
  return (
    <header className="nav">
      <div className="nav-inner container">
        <button className="nav-logo" onClick={onHome} aria-label="ContractLens home">
          <span className="nav-mark" aria-hidden="true" />
          ContractLens
        </button>

        <nav className="nav-links" aria-label="Primary">
          <a href="#product">Product</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-actions">
          <button className="btn btn-quiet">Sign in</button>
          <button className="btn btn-primary" onClick={onAnalyze}>
            Get started
          </button>
        </div>
      </div>
    </header>
  );
}