
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

function parseJson(content, label) {
  if (!content || !content.trim()) {
    throw new Error(`Empty AI response: ${label}`);
  }

  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  const parsed = JSON.parse(cleaned);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Invalid JSON object: ${label}`);
  }

  return parsed;
}

/*
 * Shared helper for LLM 2 and LLM 3.
 * Try JSON Schema first; if the API rejects that request,
 * retry once using JSON-object mode.
 */
async function createAgentCompletion({
  maxCompletionTokens,
  schemaName,
  schema,
  messages,
}) {
  try {
    return await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0,
      reasoning_effort: "low",
      max_completion_tokens: maxCompletionTokens,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          strict: true,
          schema,
        },
      },
      messages,
    });
  } catch (schemaError) {
    console.error(
      `${schemaName}: JSON Schema request failed; retrying with JSON-object mode:`,
      schemaError.message
    );

    return await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0,
      max_completion_tokens: maxCompletionTokens,
      response_format: {
        type: "json_object",
      },
      messages,
    });
  }
}

/* LLM 1: Contract extraction schema */
const extractionSchema = {
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

/* LLM 1: Extract contract data */
async function extractChunk(chunk, index, total) {
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
        schema: extractionSchema,
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

  if (!content || choice?.finish_reason === "length") {
    throw new Error(
      `Extraction returned an incomplete response for chunk ${index + 1}.`
    );
  }

  try {
    return parseJson(content, `extraction chunk ${index + 1}`);
  } catch (error) {
    console.error("Extraction JSON parsing failed:", error.message);
    throw error;
  }
}

/* LLM 2: Risk verification */
async function verifyRisks(clauses, existingRisks) {
  const relevantClauses = clauses.map((clause) => ({
    title: clause.title,
    section: clause.section,
    sourceText: (clause.sourceText || "").slice(0, 500),
    riskLevel: clause.riskLevel,
  }));

  const compactRisks = existingRisks.map((risk) => ({
    clauseTitle: risk.clauseTitle || "",
    reason: risk.reason || "",
    level: risk.level || "review",
  }));

  const riskSchema = {
    type: "object",
    properties: {
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
    },
    required: ["risks"],
    additionalProperties: false,
  };

  const response = await createAgentCompletion({
    maxCompletionTokens: 3000,
    schemaName: "risk_verification",
    schema: riskSchema,
    messages: [
      {
        role: "system",
        content: `You are ContractLens Risk Analyzer, the second-stage risk verification agent.

Verify existing risks against the supplied clause evidence.
Correct inaccurate reasons and severity levels.
When possible, use the exact title of the matching supplied clause in clauseTitle.
Do not invent facts.
Keep supported risks.
Remove a risk only if it is clearly unsupported.
If evidence is insufficient, retain the risk with level "review".
Do not add risks without supporting evidence.

Return a JSON object with a risks array.
Each risk must contain clauseTitle, reason and level.
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

/* LLM 3: Contract consistency checking */
async function checkConsistency(clauses, financialTerms, timeline) {
  const consistencySchema = {
    type: "object",
    properties: {
      issues: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            severity: {
              type: "string",
              enum: ["high", "review", "low"],
            },
            evidence: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["title", "description", "severity", "evidence"],
          additionalProperties: false,
        },
      },
    },
    required: ["issues"],
    additionalProperties: false,
  };

  const response = await createAgentCompletion({
    maxCompletionTokens: 3000,
    schemaName: "consistency_check",
    schema: consistencySchema,
    messages: [
      {
        role: "system",
        content: `You are ContractLens Consistency Checker.

Identify explicit contradictions using only the supplied contract evidence.

Check:
- Conflicting dates or deadlines for the same event.
- Inconsistent payment amounts or totals.
- Contradictory obligations between clauses.
- Conflicting termination, renewal or completion terms.

Rules:
- Different dates are not contradictions unless they refer to the same event.
- Missing information is not a contradiction.
- Never invent facts or issues.
- Use only the supplied evidence.
- If no clear contradiction exists, return {"issues":[]}.
- Keep descriptions concise.
- Severity must be high, review or low.

Return a JSON object containing an issues array.
Each issue must contain title, description, severity and evidence.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          clauses: clauses.map((clause) => ({
            title: clause.title,
            section: clause.section,
            sourceText: clause.sourceText,
          })),
          financialTerms,
          timeline,
        }),
      },
    ],
  });

  const choice = response.choices?.[0];
  const content = choice?.message?.content;

  if (!content || choice?.finish_reason === "length") {
    throw new Error("Consistency Checker returned an incomplete response.");
  }

  const parsed = parseJson(content, "consistency check");

  if (
    !Array.isArray(parsed.issues) ||
    !parsed.issues.every(
      (issue) =>
        issue &&
        typeof issue.title === "string" &&
        typeof issue.description === "string" &&
        ["high", "review", "low"].includes(issue.severity) &&
        Array.isArray(issue.evidence) &&
        issue.evidence.every((item) => typeof item === "string")
    )
  ) {
    throw new Error("Consistency Checker returned an invalid response.");
  }

  return parsed.issues;
}

/* Main contract analysis pipeline */
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

      const extracted = await extractChunk(chunks[i], i, chunks.length);
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
        const title = String(item.title || "").trim().toLowerCase();
        const source = String(item.sourceText || "").trim().toLowerCase();

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
        "LLM 2 risk verification failed; using original extracted risks:",
        error.message,
        error.status ? `HTTP ${error.status}` : ""
      );
    }

    const timeline = uniqueBy(
      extractedResults.flatMap((item) => item.timeline || []),
      (item) =>
        `${(item.date || "").trim().toLowerCase()}|${(
          item.label || ""
        ).trim().toLowerCase()}`
    );

    let consistencyIssues = [];

    try {
      consistencyIssues = await checkConsistency(
        clauses,
        financialTerms,
        timeline
      );

      console.log(
        `LLM 3 consistency check completed. Issues found: ${consistencyIssues.length}`
      );
    } catch (error) {
      console.error(
        "LLM 3 consistency check failed:",
        error.message,
        error.status ? `HTTP ${error.status}` : ""
      );
    }

    const risks = uniqueBy(
      verifiedRisks,
      (item) =>
        `${(item.clauseTitle || "").trim().toLowerCase()}|${(
          item.reason || ""
        ).trim().toLowerCase()}`
    ).map((risk, index) => {
      const normalizedRiskTitle = String(
        risk.clauseTitle || ""
      ).trim().toLowerCase();

      const matchedClause = clauses.find(
        (clause) =>
          String(clause.title || "").trim().toLowerCase() ===
            normalizedRiskTitle ||
          (clause.section &&
            String(clause.section).trim().toLowerCase() ===
              normalizedRiskTitle)
      );

      const level = ["high", "review", "standard"].includes(
        String(risk.level || "").toLowerCase()
      )
        ? String(risk.level).toLowerCase()
        : "review";

      return {
        ...risk,
        id: `r${index + 1}`,
        clauseId: matchedClause?.id ?? null,
        level,
        severity: level,
        title: risk.clauseTitle || "Contract risk",
        summary: risk.reason || "",
        whyItMatters: risk.reason || "",
        clauseRef: matchedClause?.id || risk.clauseTitle || "",
      };
    });

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
          consistencyIssues: consistencyIssues.length,
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
      consistencyIssues,
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
