
const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MAX_PDF_PAGES = 30;
const CHUNK_SIZE = 10000;
const CHUNK_OVERLAP = 500;

function splitTextIntoChunks(
  text,
  chunkSize = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP
) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));

    if (end === text.length) break;
    start = end - overlap;
  }

  return chunks;
}

function uniqueBy(items, getKey) {
  const seen = new Set();

  return items.filter((item) => {
    const key = getKey(item);

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function parseJson(content, chunkNumber) {
  if (!content || !content.trim()) {
    throw new Error(`Empty AI response for chunk ${chunkNumber}`);
  }

  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  const parsed = JSON.parse(cleaned);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Invalid JSON object in chunk ${chunkNumber}`);
  }

  return parsed;
}

const schema = {
  type: "object",
  properties: {
    title: { type: "string" },
    parties: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: { type: "string" },
          name: { type: "string" },
        },
        required: ["role", "name"],
        additionalProperties: false,
      },
    },
    financialTerms: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          value: { type: "string" },
        },
        required: ["label", "value"],
        additionalProperties: false,
      },
    },
    obligations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          party: { type: "string" },
          description: { type: "string" },
          sourceText: { type: "string" },
        },
        required: ["party", "description", "sourceText"],
        additionalProperties: false,
      },
    },
    clauses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          section: { type: "string" },
          summary: { type: "string" },
          sourceText: { type: "string" },
          riskLevel: {
            type: "string",
            enum: ["high", "review", "standard"],
          },
        },
        required: [
          "id",
          "title",
          "section",
          "summary",
          "sourceText",
          "riskLevel",
        ],
        additionalProperties: false,
      },
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          clauseTitle: { type: "string" },
          reason: { type: "string" },
          level: {
            type: "string",
            enum: ["high", "review", "standard"],
          },
        },
        required: ["clauseTitle", "reason", "level"],
        additionalProperties: false,
      },
    },
    timeline: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string" },
          label: { type: "string" },
          type: {
            type: "string",
            enum: [
              "notice",
              "renewal",
              "payment",
              "obligation",
              "start",
              "completion",
              "possession",
              "termination",
              "deadline",
              "other",
            ],
          },
        },
        required: ["date", "label", "type"],
        additionalProperties: false,
      },
    },
    qaSeed: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "title",
    "parties",
    "financialTerms",
    "obligations",
    "clauses",
    "risks",
    "timeline",
    "qaSeed",
  ],
  additionalProperties: false,
};

async function extractChunk(chunk, index, total) {
  try {
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0,
      reasoning_effort: "low",
      max_completion_tokens: 6000,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "contract_extraction",
          strict: true,
          schema,
        },
      },
      messages: [
        {
          role: "system",
          content: `You are a contract analysis extraction system.

Extract information only from the supplied contract text.
Never invent parties, dates, clauses, obligations, or risks.
Preserve exact section numbers and dates.
Extract identifiable clauses in this chunk.
Use supporting contract text in sourceText.
Identify financial terms and contractual obligations.
Flag risks only when supported by the contract.
Use empty arrays when information is absent.
For timeline events, use type "other" if none of the allowed types fit.
Return data matching the required JSON schema.`,
        },
        {
          role: "user",
          content: `Analyze contract chunk ${index + 1} of ${total}.

CONTRACT TEXT:
${chunk}`,
        },
      ],
    });

    const choice = response.choices?.[0];
    const content = choice?.message?.content;

    if (choice?.finish_reason === "length") {
      throw new Error("AI response reached its token limit.");
    }

    if (!content || !content.trim()) {
      throw new Error("Groq returned an empty response.");
    }

    return parseJson(content, index + 1);
  } catch (error) {
    console.error(
      `Extraction failed for chunk ${index + 1}/${total}:`,
      error.message
    );

    throw new Error(
      `AI extraction failed on chunk ${index + 1}: ${error.message}`
    );
  }
}

async function verifyRisks(clauses, existingRisks) {
  const relevantClauses = clauses.map((clause) => ({
    title: clause.title,
    section: clause.section,
    sourceText: (clause.sourceText || "").slice(0, 500),
    riskLevel: clause.riskLevel,
  }));

  const compactRisks = existingRisks.map((risk) => ({
    clauseTitle: risk.clauseTitle,
    reason: risk.reason,
    level: risk.level,
  }));

  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    temperature: 0,
    max_completion_tokens: 2000,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: `You are ContractLens Risk Analyzer, the second-stage risk verification agent.

Verify existing risks against the supplied clause evidence.
Correct inaccurate reasons and severity levels.
Do not invent facts.
Keep supported risks. Remove a risk only if it is clearly unsupported.
If evidence is insufficient, retain the risk with level "review".
Do not add risks without supporting evidence.
Return valid JSON only:
{"risks":[{"clauseTitle":"string","reason":"string","level":"high"}]}
Allowed levels: high, review, standard.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          clauses: relevantClauses,
          existingRisks: compactRisks,
        }),
      },
    ],
  });

  const choice = response.choices?.[0];
  const content = choice?.message?.content;

  if (!content || choice?.finish_reason === "length") {
    throw new Error("Risk Analyzer returned an incomplete response.");
  }

  const parsed = parseJson(content, "risk verification");

  if (
    !Array.isArray(parsed.risks) ||
    !parsed.risks.every(
      (risk) =>
        risk &&
        typeof risk.clauseTitle === "string" &&
        typeof risk.reason === "string" &&
        ["high", "review", "standard"].includes(risk.level)
    )
  ) {
    throw new Error("Risk Analyzer returned an invalid response.");
  }

  return parsed.risks;
}

async function analyzeContract(file) {
  let parser;

  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing from the .env file.");
    }

    if (!file?.path || !fs.existsSync(file.path)) {
      throw new Error("Uploaded PDF file was not found.");
    }

    const fileBuffer = fs.readFileSync(file.path);
    parser = new PDFParse({ data: fileBuffer });

    const result = await parser.getText();

    const totalPages = Number(
      result.total ?? result.pages?.length ?? 0
    );

    if (!Number.isInteger(totalPages) || totalPages < 1) {
      throw new Error(
        "Could not determine the PDF page count. Please try another PDF."
      );
    }

    if (totalPages > MAX_PDF_PAGES) {
      throw new Error(
        `This PDF has ${totalPages} pages. ContractLens supports a maximum of ${MAX_PDF_PAGES} pages.`
      );
    }

    const text = (result.text || "").trim();

    if (!text) {
      throw new Error(
        "No readable text found. The PDF may be scanned or image-only."
      );
    }

    const chunks = splitTextIntoChunks(text);
    const extractedResults = [];

    console.log(
      `ContractLens: ${totalPages} pages; processing ${chunks.length} chunks.`
    );

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);

      const extracted = await extractChunk(
        chunks[i],
        i,
        chunks.length
      );

      extractedResults.push(extracted);
    }

    const parties = uniqueBy(
      extractedResults.flatMap((item) => item.parties || []),
      (item) =>
        `${(item.role || "").trim().toLowerCase()}|${(
          item.name || ""
        ).trim().toLowerCase()}`
    );

    const financialTerms = uniqueBy(
      extractedResults.flatMap((item) => item.financialTerms || []),
      (item) =>
        `${(item.label || "").trim().toLowerCase()}|${(
          item.value || ""
        ).trim().toLowerCase()}`
    );

    const obligations = uniqueBy(
      extractedResults.flatMap((item) => item.obligations || []),
      (item) =>
        `${(item.party || "").trim().toLowerCase()}|${(
          item.description || ""
        ).trim().toLowerCase()}`
    );

    const clauses = uniqueBy(
      extractedResults.flatMap((item) => item.clauses || []),
      (item) => {
        const section = String(item.section || "").trim().toLowerCase();
        const title = (item.title || "").trim().toLowerCase();
        const source = (item.sourceText || "").trim().toLowerCase();

        return section || title ? `${section}|${title}` : source;
      }
    ).map((clause, index) => ({
      ...clause,
      id: `c${index + 1}`,
      heading: clause.title || "Untitled clause",
      riskLevel: ["high", "review", "standard"].includes(
        String(clause.riskLevel || "").toLowerCase()
      )
        ? String(clause.riskLevel).toLowerCase()
        : "review",
    }));

    const baseRisks = uniqueBy(
      extractedResults.flatMap((item) => item.risks || []),
      (item) =>
        `${(item.clauseTitle || "").trim().toLowerCase()}|${(
          item.reason || ""
        ).trim().toLowerCase()}`
    );

    let verifiedRisks = baseRisks;

    try {
      verifiedRisks = await verifyRisks(clauses, baseRisks);
      console.log("LLM 2 risk verification completed.");
    } catch (error) {
      console.error(
        "LLM 2 risk verification failed; using original risks:",
        error.message
      );
    }

    const risks = uniqueBy(
      verifiedRisks,
      (item) =>
        `${(item.clauseTitle || "").trim().toLowerCase()}|${(
          item.reason || ""
        ).trim().toLowerCase()}`
    ).map((risk, index) => ({
      ...risk,
      id: `r${index + 1}`,
      level: risk.level || "review",
      severity: risk.level || "review",
      title: risk.clauseTitle || "Contract risk",
      summary: risk.reason || "",
      whyItMatters: risk.reason || "",
      clauseRef: risk.clauseTitle || "",
    }));

    const timeline = uniqueBy(
      extractedResults.flatMap((item) => item.timeline || []),
      (item) =>
        `${(item.date || "").trim().toLowerCase()}|${(
          item.label || ""
        ).trim().toLowerCase()}`
    );

    const qaSeed = uniqueBy(
      extractedResults.flatMap((item) => item.qaSeed || []),
      (item) => JSON.stringify(item)
    );

    const title =
      extractedResults.find((item) => item.title)?.title ||
      "Contract Analysis";

    console.log(
      "Contract analysis summary:",
      JSON.stringify(
        {
          title,
          pages: totalPages,
          chunksProcessed: chunks.length,
          parties: parties.length,
          financialTerms: financialTerms.length,
          obligations: obligations.length,
          clauses: clauses.length,
          risks: risks.length,
          timelineEvents: timeline.length,
        },
        null,
        2
      )
    );

    return {
      success: true,
      fileName: file.originalname,
      title,
      text,
      totalPages,
      parties,
      financialTerms,
      obligations,
      clauses,
      risks,
      timeline,
      qaSeed,
    };
  } catch (error) {
    console.error("Contract analysis error:", error.message);
    throw error;
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (error) {
        console.error("PDF parser cleanup failed:", error.message);
      }
    }

    if (file?.path) {
      fs.promises.unlink(file.path).catch(() => {});
    }
  }
}

module.exports = {
  analyzeContract,
};
