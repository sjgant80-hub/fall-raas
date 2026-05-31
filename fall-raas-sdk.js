// ═══════════════════════════════════════════════════════════════════
//  fall-raas-sdk · v1.0 · Research-as-a-Service · prime 397
//  5-angle fan-out · 3-vote adversarial verification · cited synthesis
//  sovereign · BYO Anthropic key · MIT · Simon Gant 2026
//
//  Usage (ESM):
//    import { research } from 'https://sjgant80-hub.github.io/fall-raas/fall-raas-sdk.js';
//    const r = await research({ question, byoKey, onProgress });
//
//  Usage (script tag):
//    <script src="https://sjgant80-hub.github.io/fall-raas/fall-raas-sdk.js"></script>
//    FallRaaS.research({...}).then(console.log);
// ═══════════════════════════════════════════════════════════════════

const WORKER_URL = new URL('./fall-raas-worker.js', import.meta.url || location.href).href;

const DEFAULTS = {
  angles: 5,
  votes: 3,
  killThreshold: 2,
  budgetTokens: 200000,
  model: 'claude-opus-4-5',
};

// emit fall-signal event so other tools can observe runs
function emit(type, payload) {
  try {
    const bc = new BroadcastChannel('fall-signal');
    bc.postMessage({ source: 'fall-raas', prime: 397, type, payload, ts: Date.now() });
    bc.close();
  } catch (_) {}
}

// validate / clamp options
function normalise(opts) {
  const o = { ...DEFAULTS, ...opts };
  o.angles = Math.max(1, Math.min(7, o.angles | 0 || 5));
  o.votes = Math.max(2, Math.min(5, o.votes | 0 || 3));
  o.killThreshold = Math.max(1, Math.min(o.votes, o.killThreshold | 0 || 2));
  if (!o.question || typeof o.question !== 'string' || o.question.length < 6) {
    throw new Error('fall-raas: question must be a non-empty string (>=6 chars)');
  }
  return o;
}

// inline-engine path · loads worker code into same JS context (no Web Worker needed in demo)
// the worker module exposes runPipeline as default-callable
async function loadEngine() {
  const mod = await import(WORKER_URL);
  return mod.runPipeline || mod.default;
}

// ─── public: research ──────────────────────────────────────────────
async function research(opts) {
  const o = normalise(opts);
  emit('raas_run_start', { question: o.question, angles: o.angles, votes: o.votes });
  const run = await loadEngine();
  const result = await run(o);
  emit('raas_run_complete', {
    question: o.question,
    confirmed: result.findings.length,
    refuted: result.refuted.length,
    sources: result.stats.sourcesFetched,
  });
  return result;
}

// ─── public: verify ───── single-claim adversarial panel ───────────
async function verify({ claim, sources = [], votes = 3, byoKey, model, onProgress }) {
  if (!claim) throw new Error('fall-raas.verify: claim required');
  const run = await loadEngine();
  // shim: run a single-claim panel through the worker's verify helper
  const result = await run({
    question: claim,
    angles: 1,
    votes,
    killThreshold: Math.ceil(votes / 2),
    byoKey,
    model,
    onProgress,
    _mode: 'verify-only',
    _preSources: sources,
  });
  return {
    claim,
    confirmed: result.findings.length > 0,
    vote: result.findings[0]?.vote || `0/${votes}`,
    sources: result.citations,
  };
}

// ─── public: summarise ── compress a long source to claims ─────────
async function summarise({ text, byoKey, model, maxClaims = 8 }) {
  if (!text) throw new Error('fall-raas.summarise: text required');
  const run = await loadEngine();
  const result = await run({
    question: 'extract claims from provided text',
    angles: 1, votes: 1, killThreshold: 1,
    byoKey, model,
    _mode: 'summarise-only',
    _preText: text,
    _maxClaims: maxClaims,
  });
  return result.findings.slice(0, maxClaims).map(f => ({
    claim: f.claim,
    confidence: f.confidence,
  }));
}

// expose to window for non-module loaders
if (typeof window !== 'undefined') {
  window.FallRaaS = { research, verify, summarise, DEFAULTS };
}

export { research, verify, summarise, DEFAULTS };
export default research;
