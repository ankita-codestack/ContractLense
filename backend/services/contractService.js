const fs = require("fs");
const { PDFParse } = require("pdf-parse");

async function analyzeContract(file) {
  const fileBuffer = fs.readFileSync(file.path);

  const parser = new PDFParse({
    data: fileBuffer,
  });

  try {
    const result = await parser.getText();

    return {
      success: true,
      fileName: file.originalname,
      text: result.text,
    };
  } finally {
    await parser.destroy();
  }
}

module.exports = {
  analyzeContract,
};