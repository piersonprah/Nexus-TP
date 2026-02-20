import { useState, useRef } from "react";

const JURISDICTIONS = [
  { code: "US", name: "United States", risk: 2 },
  { code: "UK", name: "United Kingdom", risk: 3 },
  { code: "DE", name: "Germany", risk: 5 },
  { code: "FR", name: "France", risk: 4 },
  { code: "NL", name: "Netherlands", risk: 3 },
  { code: "IE", name: "Ireland", risk: 3 },
  { code: "IN", name: "India", risk: 5 },
  { code: "AU", name: "Australia", risk: 4 },
  { code: "CA", name: "Canada", risk: 3 },
  { code: "BR", name: "Brazil", risk: 5 },
  { code: "SG", name: "Singapore", risk: 2 },
  { code: "JP", name: "Japan", risk: 4 },
  { code: "IL", name: "Israel", risk: 3 },
  { code: "ES", name: "Spain", risk: 3 },
  { code: "IT", name: "Italy", risk: 4 },
  { code: "PL", name: "Poland", risk: 3 },
  { code: "MX", name: "Mexico", risk: 4 },
  { code: "PH", name: "Philippines", risk: 3 },
  { code: "CO", name: "Colombia", risk: 3 },
  { code: "PT", name: "Portugal", risk: 2 },
  { code: "OTHER", name: "Other", risk: 3 },
];

const HIGH_SCRUTINY = ["DE","FR","IN","AU","BR","JP","IT","MX"];

const QUESTIONS = [
  {
    id: "entities",
    section: "Entity Structure",
    sectionNum: 1,
    question: "How many legal entities are in your corporate group?",
    why: "More entities = more intercompany relationships = more compliance surface area.",
    type: "single",
    options: [
      { label: "2", value: "2", score: 0 },
      { label: "3–5", value: "3-5", score: 5 },
      { label: "6–10", value: "6-10", score: 10 },
      { label: "10+", value: "10+", score: 15 },
    ],
  },
  {
    id: "countries",
    section: "Entity Structure",
    sectionNum: 1,
    question: "Which countries do your entities operate in?",
    why: "Certain jurisdictions (Germany, India, Australia, Brazil) enforce TP aggressively.",
    type: "multi-jurisdiction",
  },
  {
    id: "origin",
    section: "Entity Structure",
    sectionNum: 1,
    question: "How did your foreign entities come about?",
    why: "This validates the 'Accidental Multinational' thesis and tells you how they got here.",
    type: "single",
    options: [
      { label: "Graduated from an EOR (Deel, Remote, etc.)", value: "eor", score: 8 },
      { label: "Set up entities ourselves from the start", value: "organic", score: 3 },
      { label: "Acquired a company with foreign entities", value: "acquisition", score: 5 },
      { label: "Mix of the above", value: "mix", score: 6 },
    ],
  },
  {
    id: "txn_types",
    section: "Transactions",
    sectionNum: 2,
    question: "What flows between your entities?",
    why: "Each transaction type has different documentation requirements and risk profiles.",
    type: "multi",
    options: [
      { label: "Shared services (dev, support, ops)", value: "services" },
      { label: "IP licensing or royalties", value: "ip" },
      { label: "Management fees", value: "mgmt" },
      { label: "Intercompany loans", value: "loans" },
      { label: "Cost recharges / allocations", value: "recharges" },
      { label: "Sale of goods", value: "goods" },
    ],
  },
  {
    id: "txn_value",
    section: "Transactions",
    sectionNum: 2,
    question: "What's the approximate annual value of all intercompany transactions?",
    why: "Higher values = more materiality = more scrutiny from tax authorities.",
    type: "single",
    options: [
      { label: "Under $100K", value: "<100k", score: 0 },
      { label: "$100K – $500K", value: "100k-500k", score: 5 },
      { label: "$500K – $2M", value: "500k-2m", score: 12 },
      { label: "Over $2M", value: ">2m", score: 18 },
    ],
  },
  {
    id: "agreements",
    section: "Documentation",
    sectionNum: 3,
    question: "Do you have signed intercompany agreements for these transactions?",
    why: "The #1 gap. Without agreements, you have zero defense in an audit.",
    type: "single",
    options: [
      { label: "Yes, for all entity pairs", value: "all", score: 0 },
      { label: "Yes, for some", value: "some", score: 12 },
      { label: "No", value: "none", score: 25 },
      { label: "Not sure", value: "unsure", score: 20 },
    ],
  },
  {
    id: "tp_policy",
    section: "Documentation",
    sectionNum: 3,
    question: "Do you have a documented transfer pricing policy?",
    why: "A written policy is the foundation of defensibility. Most startups don't have one.",
    type: "single",
    options: [
      { label: "Yes, reviewed within the last year", value: "current", score: 0 },
      { label: "Yes, but it's outdated", value: "outdated", score: 10 },
      { label: "No formal policy", value: "none", score: 20 },
      { label: "Not sure what this means", value: "unsure", score: 18 },
    ],
  },
  {
    id: "benchmarking",
    section: "Documentation",
    sectionNum: 3,
    question: "Have you conducted a benchmarking study to support your pricing?",
    why: "Benchmarking proves your prices are arm's length. Required in most jurisdictions above materiality thresholds.",
    type: "single",
    options: [
      { label: "Yes, within the last 3 years", value: "recent", score: 0 },
      { label: "Yes, but more than 3 years ago", value: "old", score: 8 },
      { label: "No", value: "none", score: 15 },
      { label: "Not sure what this means", value: "unsure", score: 15 },
    ],
  },
  {
    id: "local_file",
    section: "Documentation",
    sectionNum: 3,
    question: "Do you prepare transfer pricing documentation (Local File, Master File)?",
    why: "Many countries legally require TP documentation above certain thresholds. Non-compliance = penalties.",
    type: "single",
    options: [
      { label: "Yes, for all required jurisdictions", value: "all", score: 0 },
      { label: "Yes, for some", value: "some", score: 10 },
      { label: "No", value: "none", score: 15 },
      { label: "Not sure if we're required to", value: "unsure", score: 12 },
    ],
  },
  {
    id: "calc_method",
    section: "Operations",
    sectionNum: 4,
    question: "How do you currently calculate intercompany charges?",
    why: "The gap between 'formal policy' and 'we just transfer what's needed' is where the risk lives.",
    type: "single",
    options: [
      { label: "Formal calculation following our TP policy", value: "formal", score: 0 },
      { label: "Spreadsheet with rough cost allocation", value: "spreadsheet", score: 8 },
      { label: "Our accountant handles it", value: "accountant", score: 5 },
      { label: "We estimate / transfer what's needed", value: "adhoc", score: 18 },
      { label: "We don't really do this", value: "none", score: 22 },
    ],
  },
  {
    id: "frequency",
    section: "Operations",
    sectionNum: 4,
    question: "How often do you process intercompany charges?",
    why: "Infrequent processing = larger year-end adjustments = more audit risk.",
    type: "single",
    options: [
      { label: "Monthly", value: "monthly", score: 0 },
      { label: "Quarterly", value: "quarterly", score: 5 },
      { label: "Annually", value: "annual", score: 12 },
      { label: "Ad hoc / when we remember", value: "adhoc", score: 15 },
    ],
  },
  {
    id: "owner",
    section: "Operations",
    sectionNum: 4,
    question: "Who is responsible for intercompany compliance in your company?",
    why: "No clear owner = things fall through cracks. Also tells you who to sell to.",
    type: "single",
    options: [
      { label: "Dedicated tax / TP person", value: "dedicated", score: 0 },
      { label: "Controller / Finance Manager", value: "controller", score: 3 },
      { label: "CFO (among many other things)", value: "cfo", score: 8 },
      { label: "External accountant / fractional CFO", value: "external", score: 5 },
      { label: "Nobody specific", value: "nobody", score: 15 },
    ],
  },
  {
    id: "audit_history",
    section: "Risk Signals",
    sectionNum: 5,
    question: "Have you received questions about transfer pricing from auditors or tax authorities?",
    why: "Prior inquiries mean you're already on the radar.",
    type: "single",
    options: [
      { label: "Yes, from a tax authority", value: "tax_auth", score: 15 },
      { label: "Yes, from our external auditor", value: "auditor", score: 8 },
      { label: "Yes, during due diligence (fundraise or M&A)", value: "dd", score: 10 },
      { label: "No", value: "none", score: 0 },
    ],
  },
  {
    id: "upcoming",
    section: "Risk Signals",
    sectionNum: 5,
    question: "Are you planning any of the following in the next 12 months?",
    why: "Fundraise and M&A are when TP gaps get exposed. Creates urgency.",
    type: "multi",
    options: [
      { label: "Fundraise (Series A+)", value: "fundraise" },
      { label: "M&A (acquiring or being acquired)", value: "ma" },
      { label: "Opening new foreign entities", value: "new_entities" },
      { label: "External audit", value: "audit" },
      { label: "None of the above", value: "none" },
    ],
  },
];

const SECTION_COLORS = {
  1: { bg: "bg-indigo-500", light: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  2: { bg: "bg-violet-500", light: "bg-violet-50", text: "text-violet-600", border: "border-violet-200" },
  3: { bg: "bg-rose-500", light: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
  4: { bg: "bg-amber-500", light: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  5: { bg: "bg-red-500", light: "bg-red-50", text: "text-red-600", border: "border-red-200" },
};

function ScoreGauge({ score }) {
  let color = "text-green-500";
  let bg = "bg-green-50";
  let label = "LOW RISK";
  let desc = "Your intercompany compliance is in reasonable shape. Focus on maintaining what you have.";
  if (score > 25) { color = "text-yellow-500"; bg = "bg-yellow-50"; label = "MODERATE RISK"; desc = "You have some compliance gaps that should be addressed. Prioritize the items below."; }
  if (score > 50) { color = "text-orange-500"; bg = "bg-orange-50"; label = "HIGH RISK"; desc = "Material compliance gaps exist. Without action, you're exposed to audit risk, penalties, and deal complications."; }
  if (score > 75) { color = "text-red-600"; bg = "bg-red-50"; label = "CRITICAL RISK"; desc = "Significant exposure across multiple areas. Immediate action recommended to avoid penalties and protect upcoming transactions."; }
  const pct = Math.min(score, 100);
  return (
    <div className={`${bg} rounded-2xl p-8 text-center mb-8`}>
      <div className="text-sm font-semibold tracking-widest text-gray-400 mb-2">YOUR TP RISK SCORE</div>
      <div className={`text-7xl font-black ${color} mb-1`}>{score}</div>
      <div className="text-sm text-gray-400 mb-4">out of 100</div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4 max-w-md mx-auto">
        <div className={`h-3 rounded-full transition-all duration-1000`} style={{ width: `${pct}%`, background: score > 75 ? '#dc2626' : score > 50 ? '#f97316' : score > 25 ? '#eab308' : '#22c55e' }} />
      </div>
      <div className={`text-lg font-bold ${color} mb-2`}>{label}</div>
      <p className="text-gray-600 max-w-lg mx-auto text-sm">{desc}</p>
    </div>
  );
}

function GapItem({ icon, title, desc, severity }) {
  const sc = { critical: "bg-red-50 border-red-200", high: "bg-orange-50 border-orange-200", medium: "bg-yellow-50 border-yellow-200", low: "bg-blue-50 border-blue-200" };
  const st = { critical: "text-red-600", high: "text-orange-600", medium: "text-yellow-700", low: "text-blue-600" };
  const sl = { critical: "CRITICAL", high: "HIGH", medium: "MEDIUM", low: "LOW" };
  return (
    <div className={`${sc[severity]} border rounded-xl p-4 mb-3`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-800 text-sm">{title}</span>
            <span className={`text-xs font-bold ${st[severity]} px-2 py-0.5 rounded-full bg-white`}>{sl[severity]}</span>
          </div>
          <p className="text-gray-600 text-sm">{desc}</p>
        </div>
      </div>
    </div>
  );
}

const API_URL = "https://xmrd6fdrpa.execute-api.us-east-1.amazonaws.com/send-report";

export default function TPRiskAssessment() {
  const [screen, setScreen] = useState("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [email, setEmail] = useState("");
  const [sendStatus, setSendStatus] = useState("idle"); // idle | sending | sent | error
  const topRef = useRef(null);

  const scrollUp = () => topRef.current?.scrollIntoView({ behavior: "smooth" });

  const q = QUESTIONS[step];
  const progress = ((step) / QUESTIONS.length) * 100;

  const setAnswer = (id, val) => setAnswers(p => ({ ...p, [id]: val }));

  const canProceed = () => {
    if (!q) return false;
    const a = answers[q.id];
    if (q.type === "multi-jurisdiction") return a && a.length > 0;
    if (q.type === "multi") return a && a.length > 0;
    return a !== undefined && a !== null;
  };

  const next = () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      scrollUp();
    } else {
      setScreen("results");
      scrollUp();
    }
  };

  const prev = () => {
    if (step > 0) { setStep(step - 1); scrollUp(); }
  };

  const calcScore = () => {
    let raw = 0;
    // Base scores from single-select questions
    QUESTIONS.forEach(q => {
      const a = answers[q.id];
      if (!a) return;
      if (q.type === "single" && q.options) {
        const opt = q.options.find(o => o.value === a);
        if (opt) raw += opt.score || 0;
      }
    });
    // Jurisdiction risk: each high-scrutiny country adds points
    const countries = answers.countries || [];
    const highScrutiny = countries.filter(c => HIGH_SCRUTINY.includes(c));
    raw += highScrutiny.length * 3;
    // Transaction type complexity bonuses
    const txnTypes = answers.txn_types || [];
    if (txnTypes.includes("ip")) raw += 8;
    if (txnTypes.includes("loans")) raw += 5;
    if (txnTypes.length >= 4) raw += 5;
    // Upcoming events amplify existing risk
    const upcoming = answers.upcoming || [];
    if ((upcoming.includes("fundraise") || upcoming.includes("ma")) && raw > 30) raw += 10;
    if (upcoming.includes("new_entities")) raw += 3;

    // Normalize: max realistic raw ≈ 200 (worst answers + 3 high-scrutiny + IP/loans + amplifier)
    // Scale to 0-100 with slight curve to spread the middle range
    const normalized = (raw / 200) * 100;
    // Apply a sqrt curve so moderate scores don't bunch up at the top
    const curved = Math.pow(normalized / 100, 0.85) * 100;
    return Math.min(Math.round(curved), 100);
  };

  const getGaps = () => {
    const gaps = [];
    const a = answers;
    if (a.agreements === "none" || a.agreements === "unsure") gaps.push({ icon: "📄", title: "Missing intercompany agreements", desc: "Without signed agreements, you have no legal basis for your intercompany transactions. This is the #1 finding in TP audits. Draft agreements for each entity pair covering scope, pricing method, and payment terms.", severity: "critical" });
    else if (a.agreements === "some") gaps.push({ icon: "📄", title: "Incomplete intercompany agreements", desc: "Some entity pairs lack formal agreements. Each intercompany relationship needs its own signed agreement to be defensible.", severity: "high" });
    if (a.tp_policy === "none" || a.tp_policy === "unsure") gaps.push({ icon: "📋", title: "No documented TP policy", desc: "A written transfer pricing policy documents your pricing methodology (e.g., cost-plus at 10%), the rationale, and how it's applied. Without one, you're relying on verbal understanding — which won't hold up in an audit.", severity: "critical" });
    else if (a.tp_policy === "outdated") gaps.push({ icon: "📋", title: "Outdated TP policy", desc: "Your transfer pricing policy should be reviewed annually to reflect changes in entity structure, transaction types, and local regulations.", severity: "medium" });
    if (a.benchmarking === "none" || a.benchmarking === "unsure") {
      const val = a.txn_value;
      if (val === "500k-2m" || val === ">2m") gaps.push({ icon: "📊", title: "No benchmarking study for material transactions", desc: `With ${val === ">2m" ? "over $2M" : "$500K–$2M"} in annual intercompany value, most jurisdictions expect you to demonstrate arm's length pricing with a benchmarking study against comparable third-party transactions.`, severity: "high" });
      else gaps.push({ icon: "📊", title: "No benchmarking study", desc: "A benchmarking study compares your intercompany pricing to what unrelated parties charge. While your transaction volume is lower, having one strengthens your defensibility.", severity: "medium" });
    }
    if (a.local_file === "none" || a.local_file === "unsure") {
      const countries = a.countries || [];
      const reqCountries = countries.filter(c => ["DE","FR","IN","AU","BR","JP","IT","MX","NL","ES","PL"].includes(c));
      if (reqCountries.length > 0) gaps.push({ icon: "🗂️", title: "Missing required TP documentation (Local File)", desc: `Based on your entity locations, you likely have Local File documentation requirements in: ${reqCountries.map(c => JURISDICTIONS.find(j=>j.code===c)?.name).join(", ")}. Non-compliance can trigger penalties even without an active audit.`, severity: "high" });
      else gaps.push({ icon: "🗂️", title: "No TP documentation prepared", desc: "Even where not strictly required, having TP documentation (a simple Local File) dramatically reduces risk and speeds up any future audit or due diligence process.", severity: "medium" });
    }
    if (a.calc_method === "adhoc" || a.calc_method === "none") gaps.push({ icon: "🔢", title: "No formal calculation process", desc: "Ad hoc or missing intercompany calculations mean your actual cash flows may not match your stated TP policy. This inconsistency is a red flag for auditors.", severity: "high" });
    if (a.frequency === "annual" || a.frequency === "adhoc") gaps.push({ icon: "📅", title: "Infrequent intercompany processing", desc: "Processing charges annually or ad hoc leads to large year-end adjustments that attract scrutiny. Monthly processing creates a clean, defensible audit trail.", severity: "medium" });
    if (a.owner === "nobody") gaps.push({ icon: "👤", title: "No clear compliance owner", desc: "Without someone responsible for intercompany compliance, tasks get missed. Assign a specific person or engage an external advisor with a defined scope.", severity: "high" });
    const countries = a.countries || [];
    const highScr = countries.filter(c => HIGH_SCRUTINY.includes(c));
    if (highScr.length > 0) gaps.push({ icon: "🌍", title: `High-scrutiny jurisdictions: ${highScr.map(c => JURISDICTIONS.find(j=>j.code===c)?.name).join(", ")}`, desc: "These countries are known for aggressive TP enforcement with dedicated audit programs. Documentation requirements are stricter and penalties for non-compliance are higher.", severity: "medium" });
    const txnTypes = a.txn_types || [];
    if (txnTypes.includes("ip") && (a.tp_policy === "none" || a.tp_policy === "unsure")) gaps.push({ icon: "💡", title: "IP licensing without documented policy", desc: "IP transactions (licensing, royalties) are the highest-scrutiny area in transfer pricing. Tax authorities pay special attention to how IP is priced. This needs documentation urgently.", severity: "critical" });
    const upcoming = a.upcoming || [];
    if ((upcoming.includes("fundraise") || upcoming.includes("ma")) && calcScore() > 40) gaps.push({ icon: "⚡", title: "Upcoming transaction will expose gaps", desc: `With a ${upcoming.includes("fundraise") ? "fundraise" : "M&A transaction"} planned, your TP gaps will surface during due diligence. Investors and acquirers routinely flag undocumented intercompany arrangements as risk items that can delay or reduce deal value.`, severity: "critical" });
    gaps.sort((a, b) => { const o = { critical: 0, high: 1, medium: 2, low: 3 }; return o[a.severity] - o[b.severity]; });
    return gaps;
  };

  const getActions = () => {
    const actions = [];
    const a = answers;
    if (a.agreements === "none" || a.agreements === "unsure" || a.agreements === "some") actions.push({ time: "This week", action: "Draft and sign intercompany agreements for each entity pair", detail: "Cover: parties, services/transactions, pricing method, payment terms, effective date. Templates are available — you don't need a lawyer for V1." });
    if (a.tp_policy === "none" || a.tp_policy === "unsure") actions.push({ time: "Within 2 weeks", action: "Write a 1-2 page transfer pricing policy memo", detail: "Document: which TP method you use (e.g., cost-plus), why it's appropriate, how you calculate charges, and how often. This is your 'defense playbook.'" });
    if (a.calc_method === "adhoc" || a.calc_method === "none" || a.frequency !== "monthly") actions.push({ time: "Within 30 days", action: "Set up a monthly intercompany invoicing process", detail: "Generate invoices + journal entries every month-end. Use a tool or spreadsheet — the key is consistency and documentation." });
    if ((a.benchmarking === "none" || a.benchmarking === "unsure") && (a.txn_value === "500k-2m" || a.txn_value === ">2m")) actions.push({ time: "Within 90 days", action: "Commission a benchmarking study", detail: "Compare your pricing to comparable third-party transactions. Can be done by a TP advisor or using benchmarking databases." });
    if (a.local_file === "none" || a.local_file === "unsure") {
      const countries = a.countries || [];
      const req = countries.filter(c => ["DE","FR","IN","AU","BR","JP","IT","MX","NL","ES","PL"].includes(c));
      if (req.length > 0) actions.push({ time: "Within 90 days", action: `Prepare Local File documentation for ${req.map(c => JURISDICTIONS.find(j=>j.code===c)?.name).join(", ")}`, detail: "Check local thresholds — you may already be required to file. Start with the highest-risk jurisdiction." });
    }
    return actions;
  };

  const sendReport = async () => {
    if (!email || !email.includes("@")) return;
    setSendStatus("sending");
    try {
      const score = calcScore();
      const gaps = getGaps();
      const actions = getActions();
      const a = answers;
      const txnValueMap = { "<100k": "<$100K", "100k-500k": "$100K–$500K", "500k-2m": "$500K–$2M", ">2m": "$2M+" };
      const summary = {
        entities: a.entities || "—",
        countriesCount: (a.countries || []).length,
        txnValue: txnValueMap[a.txn_value] || "—",
        txnTypesCount: (a.txn_types || []).length,
      };
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, score, summary, gaps, actions }),
      });
      if (!res.ok) throw new Error("Failed");
      setSendStatus("sent");
    } catch (err) {
      console.error(err);
      setSendStatus("error");
      setTimeout(() => setSendStatus("idle"), 4000);
    }
  };

  // INTRO SCREEN
  if (screen === "intro") return (
    <div ref={topRef} className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-bold tracking-wider px-4 py-2 rounded-full mb-6">NEXUS · FREE ASSESSMENT</div>
          <h1 className="text-3xl font-black text-gray-900 mb-4 leading-tight">Is your intercompany<br />setup audit-ready?</h1>
          <p className="text-gray-500 text-base max-w-md mx-auto mb-2">14 questions. 3 minutes. Get a personalized risk score with specific gaps and action items.</p>
          <p className="text-gray-400 text-sm">No signup required. Your data stays in your browser.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="text-sm font-semibold text-gray-700 mb-4">What you'll get:</div>
          <div className="space-y-3">
            {[["📊","Risk score (0–100) across 5 compliance dimensions"],["🔍","Specific gaps identified in your current setup"],["✅","Prioritized action plan with timelines"],["🌍","Jurisdiction-specific notes for your countries"]].map(([e,t],i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-lg">{e}</span>
                <span className="text-gray-600 text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => setScreen("quiz")} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors text-base">Start Assessment →</button>
        <div className="text-center mt-6">
          <div className="text-xs text-gray-400">Built for companies with 2+ legal entities doing business across borders.</div>
        </div>
      </div>
    </div>
  );

  // RESULTS SCREEN
  if (screen === "results") {
    const score = calcScore();
    const gaps = getGaps();
    const actions = getActions();
    const a = answers;
    return (
      <div ref={topRef} className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-bold tracking-wider px-4 py-2 rounded-full mb-4">YOUR RESULTS</div>
          </div>
          <ScoreGauge score={score} />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-1 text-lg">Your Setup at a Glance</h2>
            <p className="text-gray-400 text-xs mb-4">Based on your responses</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-400 text-xs block">Entities</span><span className="font-semibold text-gray-800">{a.entities || "—"}</span></div>
              <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-400 text-xs block">Countries</span><span className="font-semibold text-gray-800">{(a.countries||[]).length}</span></div>
              <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-400 text-xs block">Annual IC Value</span><span className="font-semibold text-gray-800">{a.txn_value === "<100k" ? "<$100K" : a.txn_value === "100k-500k" ? "$100K–$500K" : a.txn_value === "500k-2m" ? "$500K–$2M" : a.txn_value === ">2m" ? "$2M+" : "—"}</span></div>
              <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-400 text-xs block">Transaction Types</span><span className="font-semibold text-gray-800">{(a.txn_types||[]).length}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-1 text-lg">Gaps Identified</h2>
            <p className="text-gray-400 text-xs mb-4">{gaps.length} issue{gaps.length !== 1 ? "s" : ""} found, ranked by severity</p>
            {gaps.slice(0, 2).map((g, i) => <GapItem key={i} {...g} />)}
            {gaps.length === 0 && <p className="text-gray-500 text-sm">No major gaps identified. Keep up the good work.</p>}
            {gaps.length > 2 && sendStatus !== "sent" && (
              <div className="relative mt-2">
                <div className="select-none" style={{ filter: "blur(5px)", pointerEvents: "none" }}>
                  {gaps.slice(2).map((g, i) => <GapItem key={i + 2} {...g} />)}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
                  <div className="text-center px-6 py-5 max-w-sm">
                    <div className="text-2xl mb-2">🔒</div>
                    <p className="font-semibold text-gray-800 text-sm mb-1">+{gaps.length - 2} more issue{gaps.length - 2 !== 1 ? "s" : ""} identified</p>
                    <p className="text-gray-500 text-xs mb-3">Enter your email to unlock the full report with all gaps and your personalized action plan.</p>
                    <div className="flex gap-2">
                      <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" disabled={sendStatus === "sending"} />
                      <button onClick={sendReport} disabled={sendStatus === "sending" || !email.includes("@")}
                        className={`font-semibold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap ${
                          sendStatus === "sending" ? "bg-gray-400 text-white cursor-wait" :
                          sendStatus === "error" ? "bg-red-600 text-white" :
                          !email.includes("@") ? "bg-gray-300 text-gray-500 cursor-not-allowed" :
                          "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}>
                        {sendStatus === "sending" ? "..." : sendStatus === "error" ? "Retry" : "Unlock"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {gaps.length > 2 && sendStatus === "sent" && gaps.slice(2).map((g, i) => <GapItem key={i + 2} {...g} />)}
          </div>
          {actions.length > 0 && sendStatus !== "sent" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="font-bold text-gray-900 mb-1 text-lg">Recommended Action Plan</h2>
              <p className="text-gray-400 text-xs mb-4">Prioritized by urgency</p>
              {actions.slice(0, 1).map((ac, i) => (
                <div key={i} className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-800 text-sm">{ac.action}</span>
                    </div>
                    <span className="text-xs font-semibold text-indigo-500 block mb-1">⏱ {ac.time}</span>
                    <p className="text-gray-500 text-xs">{ac.detail}</p>
                  </div>
                </div>
              ))}
              {actions.length > 1 && (
                <div className="relative mt-2">
                  <div className="select-none" style={{ filter: "blur(5px)", pointerEvents: "none" }}>
                    {actions.slice(1).map((ac, i) => (
                      <div key={i + 1} className="flex items-start gap-3 mb-4 last:mb-0">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{i + 2}</div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-gray-800 text-sm">{ac.action}</span>
                          </div>
                          <span className="text-xs font-semibold text-indigo-500 block mb-1">⏱ {ac.time}</span>
                          <p className="text-gray-500 text-xs">{ac.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
                    <div className="text-center px-6">
                      <div className="text-2xl mb-2">🔒</div>
                      <p className="font-semibold text-gray-800 text-sm">+{actions.length - 1} more action{actions.length - 1 !== 1 ? "s" : ""}</p>
                      <p className="text-gray-500 text-xs mt-1">Submit your email above to see your full action plan.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {actions.length > 0 && sendStatus === "sent" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="font-bold text-gray-900 mb-1 text-lg">Recommended Action Plan</h2>
              <p className="text-gray-400 text-xs mb-4">Prioritized by urgency</p>
              {actions.map((ac, i) => (
                <div key={i} className="flex items-start gap-3 mb-4 last:mb-0">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-800 text-sm">{ac.action}</span>
                    </div>
                    <span className="text-xs font-semibold text-indigo-500 block mb-1">⏱ {ac.time}</span>
                    <p className="text-gray-500 text-xs">{ac.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {(() => {
            const hasDocGap = a.tp_policy === "none" || a.tp_policy === "unsure" || a.tp_policy === "outdated";
            const hasCalcGap = a.calc_method === "adhoc" || a.calc_method === "none" || a.calc_method === "spreadsheet";
            const hasFreqGap = a.frequency !== "monthly";
            const hasAgreementGap = a.agreements === "none" || a.agreements === "unsure" || a.agreements === "some";
            const showInvoiceCTA = hasCalcGap || hasFreqGap || hasDocGap;
            const showAgreementCTA = hasAgreementGap && !showInvoiceCTA;

            if (score <= 25) return (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-6 mb-6 text-center">
                <h3 className="font-bold text-gray-900 mb-2">You're in good shape.</h3>
                <p className="text-gray-600 text-sm mb-4">Stay ahead by automating your monthly intercompany invoicing — consistent documentation is your best defense over time.</p>
                <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition-colors text-sm">Automate Your Monthly Close →</button>
              </div>
            );

            if (showInvoiceCTA) return (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-6 text-center">
                <h3 className="font-bold text-gray-900 mb-2">
                  {hasCalcGap ? "Replace your spreadsheet with a proper invoicing process" : hasFreqGap ? "Switch to monthly invoicing — it's the fastest way to reduce your score" : "Build your documentation trail automatically"}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {hasCalcGap
                    ? "Our free Invoice Generator calculates your intercompany recharges, applies your markup and FX conversion, and produces a compliant invoice + cost breakdown memo."
                    : hasFreqGap
                    ? "Moving from quarterly or ad hoc to monthly processing creates a clean audit trail. Our Invoice Generator makes the monthly process take minutes, not hours."
                    : "Every invoice you generate comes with a cost breakdown memo documenting your methodology — the same document Big 4 firms charge thousands to prepare."}
                </p>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-colors text-sm">Try the Invoice Generator — Free →</button>
              </div>
            );

            if (showAgreementCTA) return (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-6 text-center">
                <h3 className="font-bold text-gray-900 mb-2">Start with intercompany agreements — your biggest gap</h3>
                <p className="text-gray-600 text-sm mb-4">Signed agreements are the foundation of TP compliance. We're building templates you can customize in minutes. Leave your email and we'll notify you when they're ready.</p>
                <div className="flex gap-2 max-w-md mx-auto">
                  <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm whitespace-nowrap">Notify Me</button>
                </div>
              </div>
            );

            return null;
          })()}
          {sendStatus === "sent" && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span className="text-green-700 text-sm font-medium">Full report unlocked and sent to your inbox!</span>
              </div>
            </div>
          )}
          <div className="text-center">
            <button onClick={() => { setScreen("intro"); setStep(0); setAnswers({}); scrollUp(); }} className="text-gray-400 hover:text-gray-600 text-sm underline">Start over</button>
          </div>
        </div>
      </div>
    );
  }

  // QUIZ SCREEN
  const sectionColor = SECTION_COLORS[q.sectionNum];
  return (
    <div ref={topRef} className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-semibold">{step + 1} of {QUESTIONS.length}</span>
          <span className={`text-xs font-bold tracking-wider ${sectionColor.text} ${sectionColor.light} px-3 py-1 rounded-full`}>{q.section.toUpperCase()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-8">
          <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2 leading-snug">{q.question}</h2>
          <p className="text-gray-400 text-xs mb-6 italic">{q.why}</p>

          {q.type === "single" && (
            <div className="space-y-2">
              {q.options.map(opt => (
                <button key={opt.value} onClick={() => setAnswer(q.id, opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    answers[q.id] === opt.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-100 hover:border-gray-200 text-gray-700"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {q.type === "multi" && (
            <div className="space-y-2">
              {q.options.map(opt => {
                const sel = (answers[q.id] || []).includes(opt.value);
                return (
                  <button key={opt.value} onClick={() => {
                    const cur = answers[q.id] || [];
                    if (opt.value === "none") { setAnswer(q.id, ["none"]); return; }
                    const filtered = cur.filter(v => v !== "none");
                    setAnswer(q.id, sel ? filtered.filter(v => v !== opt.value) : [...filtered, opt.value]);
                  }}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      sel ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-100 hover:border-gray-200 text-gray-700"
                    }`}>
                    <span className="mr-2">{sel ? "☑" : "☐"}</span>{opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "multi-jurisdiction" && (() => {
            const maxMap = { "2": 2, "3-5": 5, "6-10": 10, "10+": 50 };
            const maxCountries = maxMap[answers.entities] || 50;
            const selected = answers.countries || [];
            const atLimit = selected.length >= maxCountries;
            return (
            <div>
              {maxCountries <= 10 && <p className="text-xs text-indigo-500 font-semibold mb-3">Select up to {maxCountries} countries (based on {answers.entities} entities)</p>}
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
              {JURISDICTIONS.map(j => {
                const sel = selected.includes(j.code);
                const disabled = !sel && atLimit;
                return (
                  <button key={j.code} disabled={disabled} onClick={() => {
                    if (disabled) return;
                    const cur = answers.countries || [];
                    setAnswer("countries", sel ? cur.filter(c => c !== j.code) : [...cur, j.code]);
                  }}
                    className={`text-left px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-medium ${
                      sel ? "border-indigo-500 bg-indigo-50 text-indigo-700" : disabled ? "border-gray-50 bg-gray-50 text-gray-300 cursor-not-allowed" : "border-gray-100 hover:border-gray-200 text-gray-700"
                    }`}>
                    <span className="mr-1.5">{sel ? "☑" : "☐"}</span>{j.name}
                    {HIGH_SCRUTINY.includes(j.code) && <span className="text-xs text-red-400 ml-1">⚠</span>}
                  </button>
                );
              })}
              </div>
            </div>
            );
          })()}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={prev} className="flex-shrink-0 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-3 px-6 rounded-xl transition-colors text-sm">← Back</button>
          )}
          <button onClick={next} disabled={!canProceed()}
            className={`flex-1 font-bold py-3 rounded-xl transition-all text-sm ${
              canProceed() ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}>
            {step === QUESTIONS.length - 1 ? "See My Results →" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}
