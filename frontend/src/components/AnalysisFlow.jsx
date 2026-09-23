import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./AnalysisFlow.css";

const STAGES = [
  { id: "extract", label: "Extract", detail: "Reading clauses, parties, and terms" },
  { id: "risk", label: "Detect risks", detail: "Flagging clauses that need attention" },
  { id: "timeline", label: "Build timeline", detail: "Placing dates and deadlines in order" },
  { id: "understand", label: "Understand", detail: "Preparing evidence-linked answers" },
];

export default function AnalysisFlow({ fileName, onComplete }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= STAGES.length) {
      const t = setTimeout(onComplete, 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActiveIndex((i) => i + 1), 850);
    return () => clearTimeout(t);
  }, [activeIndex, onComplete]);

  return (
    <section className="flow container">
      <span className="eyebrow-mono">{fileName}</span>
      <h2 className="flow-title">Reading the agreement.</h2>

      <div className="flow-stages">
        {STAGES.map((stage, i) => {
          const state =
            i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
          return (
            <div className={`flow-stage flow-stage--${state}`} key={stage.id}>
              <div className="flow-stage-marker">
                {state === "done" ? (
                  <motion.svg
                    width="12"
                    height="10"
                    viewBox="0 0 12 10"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                  >
                    <motion.path
                      d="M1 5L4.5 8.5L11 1"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      fill="none"
                    />
                  </motion.svg>
                ) : state === "active" ? (
                  <motion.span
                    className="flow-pulse"
                    animate={{ scale: [1, 1.35, 1], opacity: [0.9, 0.35, 0.9] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  />
                ) : (
                  <span className="flow-dot" />
                )}
              </div>
              <div>
                <p className="flow-stage-label">{stage.label}</p>
                <p className="flow-stage-detail">{stage.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}