
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Dashboard from "./components/Dashboard.jsx";
import { contract as mockContract } from "./data/mockContract.js";
import "./App.css";

export default function App() {
  const [contractData, setContractData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [analysisError, setAnalysisError] = useState("");

  async function handleFileReady(file) {
    if (!file || file.type !== "application/pdf") {
      setAnalysisError("Please select a valid PDF file.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setAnalysisError("The PDF must be smaller than 25 MB.");
      return;
    }

    setFileName(file.name);
    setAnalysisError("");
    setIsAnalyzing(true);

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

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || `Analysis failed (${response.status}).`
        );
      }

      setContractData({
        ...data,
        fileName: data.fileName || file.name,
      });
    } catch (error) {
      console.error("Contract analysis failed:", error);
      setAnalysisError(
        error.message || "Unable to analyze the contract. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Dashboard
            contract={contractData}
            onFileReady={handleFileReady}
            isAnalyzing={isAnalyzing}
            fileName={fileName}
            analysisError={analysisError}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
