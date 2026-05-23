import { analyzeImages } from './lib/analyze.js';

function buildPrompt(count) {
  const label = count === 1 ? 'screenshot' : `${count} screenshots`;
  return `You are a brutally honest senior recruiter and resume coach.
Analyze these resume ${label} together and roast the resume across 6 categories.
Treat all images as parts of the same resume (header, experience, skills, education, etc.).

For each category, score it 1-10 (1=terrible, 10=exceptional) where you are HONEST and HARSH — most resumes score 3-6.

Return ONLY valid JSON in exactly this format, no other text:
{
  "overall_score": <number 1-10>,
  "verdict": "<one savage sentence summing up this resume — brutal but clever>",
  "formatting": { "score": <1-10>, "roast": "...", "fix": "..." },
  "impact": { "score": <1-10>, "roast": "...", "fix": "..." },
  "clarity": { "score": <1-10>, "roast": "...", "fix": "..." },
  "ats_keywords": { "score": <1-10>, "roast": "...", "fix": "..." },
  "experience": { "score": <1-10>, "roast": "...", "fix": "..." },
  "brevity": { "score": <1-10>, "roast": "...", "fix": "..." }
}

Be savage, specific, and clever. Reference what you actually see. Mention weak bullets, missing metrics, fluff, and ATS risks.`;
}

export default async function handler(req, res) {
  return analyzeImages(req, res, { buildPrompt, maxTokens: 4096, temperature: 0.7 });
}
