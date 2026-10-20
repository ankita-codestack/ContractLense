
const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function analyzeContract(file) {
  const fileBuffer = fs.readFileSync(file.path);
  const parser = new PDFParse({ data: fileBuffer });

  try {
    const result = await parser.getText();
    const text = result.text.trim();

    if (!text) {
      throw new Error("No readable text found in this PDF.");
    }

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You analyze legal contracts and return JSON only.
Use this structure:
{
  "title": "Contract title",
  "parties": [{"role": "Client", "name": "Party name"}],
  "financialTerms": [{"label": "Fee", "value": "Amount"}],
  "clauses": [{"id": "c1", "title": "Clause title", "section": "Section", "summary": "Plain-English summary", "sourceText": "Exact supporting text", "riskLevel": "high"}],
  "risks": [{"id": "r1", "level": "high", "clauseTitle": "Clause title", "reason": "Why it matters", "recommendation": "Suggested review"}],
  "timeline": [{"date": "Date as written", "label": "Event", "type": "notice"}],
  "qaSeed": []
}
Use only facts supported by the contract. Do not invent parties, amounts, dates, or obligations. If something is not found, use an empty array. Risk level must be high, review, or standard. Timeline type can be notice, renewal, payment, obligation, or start. This is informational analysis, not legal advice.`
        },
        {
          role: "user",
          content: `Analyze this contract and return the requested JSON:\n\n${text.slice(0, 24000)}`
        }
      ]
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Groq returned an empty response.");
    }

    const analysis = JSON.parse(content);
    console.log("AI ANALYSIS:", JSON.stringify(analysis, null, 2));

    return {
      success: true,
      fileName: file.originalname,
      title: analysis.title || "Contract Analysis",
      text,
      parties: analysis.parties || [],
      financialTerms: analysis.financialTerms || [],
      clauses: (analysis.clauses || []).map((clause, index) => ({
        ...clause,
        id: clause.id || `c${index + 1}`,
        heading: clause.title || clause.heading || "Untitled clause",
      })),
      risks: (analysis.risks || []).map((risk, index) => ({
        ...risk,
        id: risk.id || `r${index + 1}`,
        severity: risk.level || "review",
        title: risk.clauseTitle || "Contract risk",
        summary: risk.reason || "",
        whyItMatters: risk.reason || "",
        clauseRef: risk.clauseTitle || "",
      })),
      timeline: analysis.timeline || [],
      qaSeed: analysis.qaSeed || [],
    };
  } finally {
    await parser.destroy();
    fs.promises.unlink(file.path).catch(() => {});
  }
}

module.exports = {
  analyzeContract,
};
