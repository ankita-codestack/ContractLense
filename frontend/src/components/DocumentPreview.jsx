import "./DocumentPreview.css";

export default function DocumentPreview({ fileName, compact = false }) {
  return (
    <div className={`doc-preview ${compact ? "doc-preview--compact" : ""}`}>
      <div className="doc-preview-page">
        <span className="doc-preview-line" style={{ width: "78%" }} />
        <span className="doc-preview-line" style={{ width: "92%" }} />
        <span className="doc-preview-line" style={{ width: "60%" }} />
        <span className="doc-preview-line" style={{ width: "84%" }} />
        {!compact && (
          <>
            <span className="doc-preview-line" style={{ width: "70%" }} />
            <span className="doc-preview-line" style={{ width: "88%" }} />
          </>
        )}
      </div>
      {fileName && <span className="doc-preview-name eyebrow-mono">{fileName}</span>}
    </div>
  );
}