
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function answerContractQuestion(contractText, question, onChunk) {
  if (!contractText || !contractText.trim()) {
    throw new Error("Contract text is missing.");
  }

  if (!question || !question.trim()) {
    throw new Error("Question is required.");
  }

  const stream = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    temperature: 0,
    max_completion_tokens: 1200,
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are ContractLens, an AI contract analysis assistant.

Answer using ONLY the supplied contract text. Never invent facts, clause numbers, dates, amounts, or legal terms.

Follow this exact response structure:

## 1. Direct Answer
Answer in 2-4 clear sentences. Start with the most important conclusion.

## 2. Key Contract Terms
Use relevant bullet points. Include exact amounts, deadlines, and conditions when available.

## 3. Relevant Clauses
List relevant clause numbers and explain them briefly. If unavailable, write "Clause reference not clearly identified."

## 4. Conditions and Exceptions
Explain relevant conditions, exceptions, or differences between parties' obligations. Skip if none are relevant.

## 5. Missing Information
Mention only information the contract does not clearly specify. If nothing important is missing, write "No significant missing information identified."

STRICT RULES:
- Do not repeat information across sections.
- Keep the answer concise, professional, and easy to scan.
- Use bullets instead of long paragraphs.
- Use a table only when comparing two or more situations.
- Distinguish Buyer obligations from Seller obligations.
- Never confuse a refund with compensation or liquidated damages.
- Do not claim information is missing if it appears in the supplied text.
- If the contract does not support a conclusion, say so.
- Stay relevant to the question.
- Return only the structured answer, without greetings or introductory filler.`,
      },
      {
        role: "user",
        content: `UPLOADED CONTRACT TEXT:
${contractText.slice(0, 24000)}

USER QUESTION:
${question}

Answer based only on this contract.`,
      },
    ],
  });

  let fullAnswer = "";

  for await (const chunk of stream) {
    const text = chunk.choices?.[0]?.delta?.content || "";

    if (text) {
      fullAnswer += text;

      if (onChunk) {
        onChunk(text);
      }
    }
  }

  if (!fullAnswer.trim()) {
    throw new Error("The Q&A model returned an empty answer.");
  }

  return fullAnswer.trim();
}

module.exports = { answerContractQuestion };
