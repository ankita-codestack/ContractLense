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

    const answer = await answerContractQuestion(
      contractText,
      question
    );

    res.json({
      success: true,
      answer,
      clauseRef: null,
    });
  } catch (error) {
    console.error("Contract Q&A error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to answer the contract question.",
    });
  }
}


module.exports = {
  analyze,
  askQuestion,
};