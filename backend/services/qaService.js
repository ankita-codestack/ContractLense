
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function answerContractQuestion(contractText, question) {
  if (!contractText || !contractText.trim()) {
    throw new Error("Contract text is missing.");
  }

  if (!question || !question.trim()) {
    throw new Error("Question is required.");
  }

  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    temperature: 0,
    max_completion_tokens: 1200,
    messages: [
      {
        role: "system",
        content: `You are ContractLens, a contract question-answering assistant.

Answer strictly using the uploaded contract text. Never invent details or use information from other contracts.

Format every answer using this structure:

**Answer:** Give a direct answer in 1–2 sentences.

**Relevant Clause:** Mention the clause title or number only if explicitly available in the contract. Otherwise write "Not clearly identified in the contract text."

**Key Details:**
- List important dates, amounts, deadlines, or conditions as bullet points.
- Include only details relevant to the user's question.
- If no additional details exist, omit this section.

**What the Contract Says:** Briefly explain the relevant contractual condition in simple language.

**Missing Information:** Mention any important information the contract does not specify. If nothing relevant is missing, omit this section.

Rules:
- Do not repeat the same information in multiple sections.
- Do not create fake clause numbers, dates, fees, penalties, or notice periods.
- If the answer cannot be determined from the contract, say: "The provided contract text does not contain enough information to answer this confidently."
- Keep the response concise and easy to understand.
- This is informational assistance, not legal advice.`,
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

  const answer = response.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error("The Q&A model returned an empty answer.");
  }

  return answer;
}

module.exports = { answerContractQuestion };
