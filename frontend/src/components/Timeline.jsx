import "./Timeline.css";

export default function Timeline({ events = [] }) {
  if (!events.length) {
    return (
      <div className="timeline-empty">
        <p className="eyebrow-mono">No dated clauses detected yet</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      <ol className="timeline-track">
        {events.map((event, idx) => (
          <li key={idx} className={`timeline-item timeline-item--${event.severity || "standard"}`}>
            <span className="timeline-dot" />
            <div className="timeline-content">
              <span className="timeline-date eyebrow-mono">{event.date}</span>
              <h4 className="timeline-title">{event.title}</h4>
              {event.clauseRef && (
                <p className="timeline-ref">Source: {event.clauseRef}</p>
              )}
              {event.description && (
                <p className="timeline-desc">{event.description}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}