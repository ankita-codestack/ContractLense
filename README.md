# ContractLens 📄
### AI-Powered Contract Analysis & Risk Assessment Platform

ContractLens is an AI-powered web application designed to simplify the process of understanding and analyzing legal contracts. It uses multi-agent AI workflows to extract important contract information, identify potential risks, highlight critical clauses, and answer questions based on uploaded documents.

The platform aims to make complex legal documents easier to understand through structured insights and intelligent analysis.

## ✨ Features

- **PDF Contract Upload** – Upload legal agreements in PDF format for analysis.
- **Information Extraction** – Automatically extract contract titles, parties, financial terms, obligations, and important dates.
- **AI-Powered Risk Detection** – Identify potentially risky clauses and contractual terms.
- **Multi-Agent Analysis** – Uses multiple AI processing stages for contract extraction and risk verification.
- **Clause Analysis** – Understand important clauses and their implications.
- **AI Contract Q&A** – Ask questions about uploaded contracts and receive context-based answers.
- **Structured Insights** – View extracted information and analysis in an organized format.

## 🧠 AI Workflow

ContractLens follows a multi-stage AI analysis workflow:

1. **Document Processing** – Extract text from uploaded PDF contracts.
2. **Contract Extraction Agent** – Identify key information, parties, financial terms, obligations, clauses, and timelines.
3. **Risk Analysis Agent** – Analyze contractual clauses and identify potential risks.
4. **Risk Verification** – Verify identified risks against the original contract content.
5. **Q&A Processing** – Generate answers to user questions using the extracted contract context.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| Vite | Frontend build tool |
| Node.js | Backend runtime |
| Express.js | REST API development |
| Groq AI | AI-powered contract analysis |
| PDF Parse | PDF text extraction |
| Multer | File upload handling |
| JavaScript | Application development |

## 📂 Project Structure

```text
ContractLense/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   └── package.json
│
├── server/
│   ├── routes/
│   ├── services/
│   ├── ...
│   ├── .env
│   └── package.json
│
└── README.md
```

*Note: The structure above represents the high-level application organization.*

## 🔐 Security & Limitations

- Do not upload confidential legal documents without appropriate authorization.
- Keep API keys and sensitive configuration in environment variables.
- AI-generated analysis is intended to assist contract understanding and should not be considered a substitute for professional legal advice.

## 👩‍💻 Author

**Ankita Sharma**

B.Tech – Computer Science & Engineering
---

<p align="center">
  Built with ❤️ to make contract analysis smarter and simpler.
</p>
