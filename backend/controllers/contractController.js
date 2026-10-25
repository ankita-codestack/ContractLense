
const { analyzeContract } = require("../services/contractService");
const { answerContractQuestion } = require("../services/qaService");

async function analyze(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No contract file uploaded",
      });
    }

    const result = await analyzeContract(req.file);
    res.json(result);
  } catch (error) {
    console.error("Contract analysis error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to analyze contract",
    });
  }
}

async function askQuestion(req, res) {
  try {
    const { contractText, question } = req.body;

    if (!contractText || !question) {
      return res.status(400).json({
        success: false,
        message: "Contract text and question are required.",
      });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");

    await answerContractQuestion(contractText, question, (chunk) => {
  console.log("BACKEND CHUNK:", chunk);
  if (!res.destroyed) {
    res.write(chunk);
  }
});

    res.end();
  } catch (error) {
    console.error("Contract Q&A error:", error.message);

    if (res.headersSent) {
      res.end();
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to answer the contract question.",
      });
    }
  }
}

module.exports = {
  analyze,
  askQuestion,
};
