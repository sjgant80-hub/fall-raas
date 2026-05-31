# ◊ fall-raas · Research-as-a-Service

> **5-angle fan-out · 3-vote adversarial verification · cited synthesis · prime 397**

Productised deep-research workflow as a sovereign single-file landing + drop-in JS SDK. Decompose a question into N distinct search angles, fan-out fetch and parallelise extraction, run an adversarial refute panel on every claim, return a cited synthesis with the **refuted** list right next to the **confirmed** list — because the kill-list is the most valuable output.

**Live:** https://sjgant80-hub.github.io/fall-raas/
**SDK:** https://sjgant80-hub.github.io/fall-raas/fall-raas-sdk.js
**Worker:** https://sjgant80-hub.github.io/fall-raas/fall-raas-worker.js

---

## For users

Paste a question into the demo and press **Run research**.

- **No API key:** plays a pre-baked scenario about the 4-day work week with realistic streaming. Everything you see is the real pipeline shape — only the underlying LLM calls are mocked.
- **With Anthropic key:** runs the actual pipeline in your browser. Your key is stored in IndexedDB only and is sent direct to `api.anthropic.com`. Never to a fall-raas server. There is no fall-raas server.

What the demo shows:

1. **Scope** · question → 5 distinct search angles
2. **Search** · 5 parallel agents fetch sources, dedup URLs
3. **Fetch** · pull and strip HTML from top sources
4. **Verify** · extract claims · run 3-vote adversarial refute panel on each
5. **Synthesize** · merge dupes, rank, render cited summary

The output panel lists **confirmed findings** (green), **refuted claims** (red, with the corrected version), **open questions** (amber, where evidence is missing), and **sources** (graded by fetch quality).

---

## For developers

### Drop-in SDK

```javascript
import { research } from 'https://sjgant80-hub.github.io/fall-raas/fall-raas-sdk.js';

const result = await research({
  question: "What's the actual evidence for the 4-day work week?",
  angles: 5,           // 1-7 · default 5
  votes: 3,            // 2-5 · adversarial panel size · default 3
  killThreshold: 2,    // votes needed to kill a claim · default 2
  budgetTokens: 200000,
  byoKey: 'sk-ant-...',
  onProgress: (event) => console.log(event),  // streaming events
});

// → {
//     summary: "...",
//     findings: [{ claim, confidence, sources, evidence, vote }],
//     refuted: [{ claim, vote, sources, reason }],
//     openQuestions: [...],
//     citations: [{ url, title, quality, claimCount }],
//     stats: { angles, sourcesFetched, claimsExtracted, claimsVerified, confirmed, killed }
//   }
```

### Helpers

```javascript
import { verify, summarise } from 'https://sjgant80-hub.github.io/fall-raas/fall-raas-sdk.js';

// Verify a single claim against provided sources with an N-vote panel
const v = await verify({ claim: 'X causes Y', sources: [...], votes: 3, byoKey });
// → { claim, confirmed: true/false, vote: '3/3', sources: [...] }

// Compress a long source into structured claims
const claims = await summarise({ text: longText, byoKey, maxClaims: 8 });
// → [{ claim, confidence }, ...]
```

### Streaming events

`onProgress` receives objects of shape:

```javascript
{ phase: 'scope'|'search'|'fetch'|'verify'|'synth', status: 'start'|'angle'|'page'|'voted'|'done', ... }
```

Use this to drive your own UI · the landing page in `index.html` is a full reference implementation.

### Architecture

- `fall-raas-sdk.js` — public API · ~3.5KB · loads the worker dynamically
- `fall-raas-worker.js` — pipeline engine · ~14KB · the 5 stages live here
- `index.html` — landing + live demo · single sovereign file
- Vanilla JS only · no frameworks · no build step
- Works from `file://` in demo mode (no API key)
- BYO Anthropic key stored in IndexedDB · never leaves device except to `api.anthropic.com`

### Swapping the search backend

The default search is DuckDuckGo's instant-answer API with synthetic fallback. For production swap in Serper, Brave Search, or Google CSE:

```javascript
// In fall-raas-worker.js, replace searchOne() with:
async function searchOne(query) {
  const r = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': YOUR_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, num: 10 }),
  });
  const j = await r.json();
  return j.organic.map(o => ({ url: o.link, title: o.title, snippet: o.snippet }));
}
```

### Where this sits

| | Perplexity Pro | **fall-raas** | Deep Research (OpenAI / Google) |
|---|---|---|---|
| Adversarial verification | No | **Yes · N-vote** | No |
| Lists refuted claims | No | **Yes** | No |
| Inspectable angles | No | **Yes** | No |
| Self-host | No | **Yes · MIT** | No |
| SDK | No | **Yes · 3.5KB** | No |
| Cost | $20/mo per seat | BYO key | $20-200/mo |

---

## Konomi tiers

- **Free** · 1 run/month · ≤3 angles · ≤2 votes · branded
- **Sovereign** · unlimited self-hosted · MIT · BYO key · all sliders unlocked
- **Pro** · autonomous overnight runs · webhook · Konomi-signed audit trail · contact

---

## Doctrine

This productises the cognitive substrate pattern: every claim that comes out of an LLM is run through an independent adversarial panel before it earns citation. The refute list is treated as the high-value output, because **the worst kind of research output is one that is confidently wrong**. fall-raas tells you what was killed and why.

`prime 397 · ring R5 mirror · ◐ verify · sovereign · MIT · Simon Gant 2026`
