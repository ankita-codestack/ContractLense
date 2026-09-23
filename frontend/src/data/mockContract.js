// Placeholder analysis output shaped the way the backend's four agents
// (Extractor, Risk Flagger, Timeline Builder, Q&A) are expected to return
// it. Swap this for the real response from POST /api/analyze.

export const contract = {
  fileName: "MSA_NimbusCloud_ServiceAgreement.pdf",
  title: "Master Services Agreement",
  pageCount: 14,
  parties: [
    { role: "Client", name: "Aster & Vane Retail Group" },
    { role: "Vendor", name: "Nimbus Cloud Services, Inc." },
  ],
  effectiveDate: "March 1, 2026",
  financialTerms: [
    { label: "Monthly fee", value: "$18,400" },
    { label: "Payment terms", value: "Net 30" },
    { label: "Late penalty", value: "1.5% per month" },
    { label: "Annual escalation", value: "4% cap" },
  ],
  obligations: [
    "Vendor maintains 99.9% uptime, measured monthly.",
    "Client provides 10 business days' notice before infrastructure changes.",
    "Vendor delivers a security audit report each quarter.",
  ],
  termination: [
    "Either party may terminate for convenience with 90 days' written notice.",
    "Client may terminate immediately for a material breach uncured after 15 days.",
    "Early termination by Client triggers a fee equal to 3 months of service.",
  ],
  clauses: [
    {
      id: "c1",
      page: 2,
      heading: "1. Scope of Services",
      text:
        "Vendor shall provide cloud infrastructure hosting, monitoring, and support services as described in Exhibit A, which is incorporated herein by reference and may be amended only by mutual written consent of both parties.",
    },
    {
      id: "c2",
      page: 4,
      heading: "4.2 Fees and Payment",
      text:
        "Client shall pay Vendor a monthly service fee of $18,400, due within thirty (30) days of invoice. Amounts unpaid after the due date accrue a late penalty of 1.5% per month on the outstanding balance.",
      riskId: "r2",
    },
    {
      id: "c3",
      page: 6,
      heading: "6.1 Automatic Renewal",
      text:
        "This Agreement renews automatically for successive one-year terms unless either party provides written notice of non-renewal at least sixty (60) days prior to the end of the then-current term.",
      riskId: "r1",
    },
    {
      id: "c4",
      page: 9,
      heading: "9.3 Limitation of Liability",
      text:
        "Vendor's aggregate liability arising out of this Agreement shall not exceed the total fees paid by Client in the three (3) months preceding the claim, except in cases of gross negligence or willful misconduct.",
      riskId: "r3",
    },
    {
      id: "c5",
      page: 11,
      heading: "11.4 Termination for Convenience",
      text:
        "Either party may terminate this Agreement for convenience upon ninety (90) days' prior written notice. If Client terminates under this section prior to the end of the current term, Client shall pay an early termination fee equal to three (3) months of the then-current service fee.",
      riskId: "r4",
    },
    {
      id: "c6",
      page: 13,
      heading: "13.2 Data Return and Deletion",
      text:
        "Upon termination, Vendor shall make Client data available for export for thirty (30) days, after which all copies of Client data will be permanently deleted from Vendor's systems.",
    },
  ],
  risks: [
    {
      id: "r1",
      severity: "high",
      title: "Auto-renewal with a narrow opt-out window",
      clauseRef: "§6.1",
      page: 6,
      summary:
        "The agreement renews for a full year automatically unless notice is given 60 days out.",
      whyItMatters:
        "Missing the 60-day window locks the contract for another 12 months, even if pricing or needs have changed.",
    },
    {
      id: "r2",
      severity: "medium",
      title: "Uncapped late-payment penalty accrual",
      clauseRef: "§4.2",
      page: 4,
      summary: "Late fees accrue monthly with no stated ceiling.",
      whyItMatters:
        "Over a long payment dispute, penalty interest could compound well beyond a typical late fee.",
    },
    {
      id: "r3",
      severity: "high",
      title: "Liability cap set below likely damages",
      clauseRef: "§9.3",
      page: 9,
      summary:
        "Vendor's liability is capped at three months of fees — about $55,200.",
      whyItMatters:
        "For an outage causing significant business disruption, this cap may fall far short of actual losses.",
    },
    {
      id: "r4",
      severity: "medium",
      title: "Early termination fee equal to 3 months of service",
      clauseRef: "§11.4",
      page: 11,
      summary:
        "Exiting before term-end costs three months of fees, even with 90 days' notice already given.",
      whyItMatters:
        "Notice and fee obligations stack — a Client can give full notice and still owe the exit fee.",
    },
    {
      id: "r5",
      severity: "low",
      title: "Quarterly audit report has no delivery deadline",
      clauseRef: "§7.1",
      page: 7,
      summary: "The security audit is required quarterly, but no calendar date is fixed.",
      whyItMatters: "Ambiguity here makes the obligation hard to enforce if delayed.",
    },
    {
      id: "r6",
      severity: "info",
      title: "Data export window closes 30 days after termination",
      clauseRef: "§13.2",
      page: 13,
      summary: "Client data is deleted 30 days after the agreement ends.",
      whyItMatters: "Worth calendaring so an export isn't missed during an offboarding scramble.",
    },
  ],
  timeline: [
    { id: "t1", date: "Mar 1, 2026", label: "Agreement effective date", type: "start" },
    { id: "t2", date: "Apr 1, 2026", label: "First monthly invoice due (Net 30)", type: "payment" },
    { id: "t3", date: "Jul 1, 2026", label: "First quarterly audit report due", type: "obligation" },
    { id: "t4", date: "Jan 1, 2027", label: "60-day non-renewal notice deadline", type: "notice" },
    { id: "t5", date: "Mar 1, 2027", label: "Term renews automatically", type: "renewal" },
  ],
  qaSeed: [
    {
      question: "What happens if we terminate early?",
      answer:
        "Client can end the agreement for convenience with 90 days' written notice, but doing so before the term ends triggers a fee equal to three months of the current service rate.",
      clauseRef: "§11.4",
      page: 11,
      clauseId: "c5",
    },
  ],
};