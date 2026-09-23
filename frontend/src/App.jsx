import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import UploadWorkspace from "./components/UploadWorkspace.jsx";
import AnalysisFlow from "./components/AnalysisFlow.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Footer from "./components/Footer.jsx";
import { contract as mockContract } from "./data/mockContract.js";
import "./App.css";

// view: "landing" | "upload" | "analyzing" | "dashboard"

export default function App() {
  const [view, setView] = useState("landing");
  const [fileName, setFileName] = useState("");
  const [contractData, setContractData] = useState(mockContract);

  async function handleFileReady(file) {
    setFileName(file.name);
    setView("analyzing");

    try {
      const formData = new FormData();
      formData.append("contract", file);

      const response = await fetch(
        "http://localhost:5000/api/contracts/analyze",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();

      console.log("Backend response:", data);

      if (data.success) {
        setContractData(data);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  }

  return (
    <div className="app">
      <Navbar
        onHome={() => setView("landing")}
        onAnalyze={() => setView("upload")}
      />

      <AnimatePresence mode="wait">
        {view === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Hero
              onAnalyze={() => setView("upload")}
              onHowItWorks={() => setView("upload")}
            />
            <Footer />
          </motion.div>
        )}

        {view === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <UploadWorkspace onFileReady={handleFileReady} />
          </motion.div>
        )}

        {view === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AnalysisFlow
              fileName={fileName}
              onComplete={() => setView("dashboard")}
            />
          </motion.div>
        )}

        {view === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Dashboard contract={contractData} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}