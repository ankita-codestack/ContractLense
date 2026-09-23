import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DocumentPreview from "./DocumentPreview.jsx";
import "./UploadWorkspace.css";

export default function UploadWorkspace({ onFileReady }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  function handleFiles(list) {
    const picked = list?.[0];
    if (picked && picked.type === "application/pdf") {
      setFile(picked);
    }
  }

  return (
    <section className="upload container">
      <div className="upload-head">
        <span className="eyebrow-mono">STEP 1 — SUBMIT A DOCUMENT</span>
        <h2 className="upload-title">Bring in the contract.</h2>
        <p className="upload-sub">
          PDF only, up to 25MB. Nothing leaves this session except the text
          needed for analysis.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            className={`dropzone ${dragging ? "dropzone--active" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, scale: dragging ? 1.01 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="dropzone-doc" aria-hidden="true">
              <div className="dropzone-page">
                <span className="dropzone-page-line" style={{ width: "70%" }} />
                <span className="dropzone-page-line" style={{ width: "84%" }} />
                <span className="dropzone-page-line" style={{ width: "55%" }} />
              </div>
            </div>

            <p className="dropzone-text">
              Drag a PDF here, or{" "}
              <button className="dropzone-link" onClick={() => inputRef.current?.click()}>
                choose a file
              </button>
            </p>
            <span className="dropzone-format eyebrow-mono">.PDF · MAX 25MB</span>

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="confirm"
            className="upload-confirm"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <DocumentPreview compact />
            <div className="upload-confirm-details">
              <span className="eyebrow-mono">READY</span>
              <p className="upload-filename">{file.name}</p>
              <div className="upload-confirm-actions">
                <button className="btn btn-primary" onClick={() => onFileReady(file)}>
                  Begin analysis
                </button>
                <button className="btn btn-quiet" onClick={() => setFile(null)}>
                  Choose a different file
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}