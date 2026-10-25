# ContractLens

**From PDF to Insights — Smarter, Faster, Safer.**

> Built for the **Agentic AI Hackathon**, conducted by **Product Space**.

ContractLens is a multi-agent AI system that reads a contract for you — extracting the key facts, flagging risky clauses, building a deadline timeline, and answering your questions with the exact clause it got the answer from.

---

## The Problem

Most people sign contracts without fully reading them. Not because they don't care, but because manually scanning pages of legal text to catch one risky clause, a hidden renewal, or a buried termination notice is slow, tedious, and easy to get wrong. This affects far more than lawyers — freelancers, founders, and anyone who has ever clicked "I agree" too fast.

## The Solution

Instead of a single do-everything chatbot, ContractLens uses a **pipeline of specialized agents**, each responsible for one clear task, passing structured output to the next.

```
Contract PDF Upload
        │
        ▼
Agent 1 — Extractor          → structured data + source snippets
        │
        ▼
Agent 2 — Risk Flagger       → 🟢 Standard / 🟡 Review-worthy / 🔴 High-risk
        │
        ▼
Agent 3 — Timeline Builder   → chronological deadlines & renewals
        │
        ▼
Frontend Display             → summary, risk-tagged clauses, timeline
        │
        ▼
Agent 4 — Q&A + Version Compare → answers with source clause reference,
                                   compares two contract versions
```

## Features

- **Structured extraction** — parties, dates, clauses, and obligations pulled out of raw contract text
- **Risk flagging** — every clause tagged Standard, Review-worthy, or High-risk with a reason
- **Timeline view** — all deadlines and renewals sorted chronologically in one place
- **Source traceability** — every extracted fact and every answer is backed by the exact clause it came from, so nothing is a black box
- **Version comparison** *(stretch goal)* — upload two versions of the same contract and get a plain list of what changed

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React.js |
| Backend | Node.js |
| PDF parsing | `pdf-parse` |
| AI / Agents | LLM API (Groq / Gemini) — one prompt per agent stage |

No heavy local compute is required — every agent call is a lightweight API request, so the whole pipeline runs comfortably on a standard laptop.

## How It Works (Step by Step)

1. **Upload** — user uploads a contract PDF; `pdf-parse` extracts the raw text.
2. **Extract** — Agent 1 turns the raw text into structured JSON (parties, dates, clauses, obligations) with a source snippet for every fact.
3. **Flag risk** — Agent 2 re-checks each clause and tags it Standard, Review-worthy, or High-risk, with a short reason.
4. **Build timeline** — Agent 3 sorts every date-related fact into a chronological timeline.
5. **Display** — the frontend shows a summary, the risk-tagged clause list, and the timeline in one clean view.
6. **Ask & compare** — Agent 4 answers natural-language questions about the contract (always citing the source clause) and, time permitting, compares two versions of the same contract to highlight what changed.

## Status

🚧 Currently at the architecture / planning stage — moving into prototype build next.

## Team

Built solo for the Agentic AI Hackathon by Product Space.

---

*"Your contract, in a clearer lens."*
