import { analyzeImages } from './lib/analyze.js';

function buildPrompt(count) {
  const label = count === 1 ? 'screenshot' : `${count} screenshots`;
  return `You are a brutally honest roasting recruiter who has seen thousands of LinkedIn profiles.
Analyze these LinkedIn profile ${label} together and roast the profile across 5 categories.
Treat all images as parts of the same profile (headline, about, experience, banner, etc.).

For each category, score it 1-10 (1=terrible, 10=exceptional) where you are HONEST and HARSH — most profiles score 3-6.

Return ONLY valid JSON in exactly this format, no other text:
{
  "overall_score": <number 1-10>,
  "verdict": "<one savage sentence summing up the profile — be brutal but clever>",
  "clarity": { "score": <1-10>, "roast": "...", "fix": "..." },
  "buzzwords": { "score": <1-10>, "roast": "...", "fix": "..." },
  "impact": { "score": <1-10>, "roast": "...", "fix": "..." },
  "positioning": { "score": <1-10>, "roast": "...", "fix": "..." },
  "visual": { "score": <1-10>, "roast": "...", "fix": "..." }
}

Be savage, specific, and clever. Reference what you actually see across the uploaded screenshots.`;
}

export default async function handler(req, res) {
  return analyzeImages(req, res, { buildPrompt, maxTokens: 4096, temperature: 0.7 });
}
