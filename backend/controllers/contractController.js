const { analyzeContract } = require("../services/contractService");

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

module.exports = {
  analyze,
};