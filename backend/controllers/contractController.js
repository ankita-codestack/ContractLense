
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
    return res.json(result);
  } catch (error) {
    console.error("Contract analysis error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to analyze contract",
    });
  }
}

async function askQuestion(req, res) {
  try {
    const { contractText, question } = req.body || {};

    if (
      typeof contractText !== "string" ||
      !contractText.trim() ||
      typeof question !== "string" ||
      !question.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Contract text and question are required.",
      });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");

    await answerContractQuestion(
      contractText,
      question,
      (chunk) => {
        if (!res.destroyed && !res.writableEnded) {
          res.write(chunk);
        }
      }
    );

    if (!res.destroyed && !res.writableEnded) {
      res.end();
    }
  } catch (error) {
    console.error("Contract Q&A error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to answer the contract question.",
      });
    }

    if (!res.destroyed && !res.writableEnded) {
      res.end();
    }
  }
}

module.exports = {
  analyze,
  askQuestion,
};
