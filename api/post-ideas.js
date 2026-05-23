import { analyzeImages } from './lib/analyze.js';

function buildPrompt(count, notes) {
  const label = count === 1 ? 'screenshot' : `${count} screenshots`;
  const notesBlock = notes?.trim()
    ? `\n\nThe user also pasted these analytics notes (use alongside the images):\n${notes.trim()}`
    : '';

  return `You are a sharp LinkedIn content strategist who reads creator analytics dashboards.
Analyze these LinkedIn analytics ${label} (audience demographics, post performance, impressions, engagement, top posts, follower growth, etc.).
Infer who the audience is, what content resonates, and what is underperforming.${notesBlock}

Return ONLY valid JSON in exactly this format, no other text:
{
  "audience_summary": "<2-3 sentences describing who follows them and what they care about>",
  "top_insights": ["<insight 1 from the data>", "<insight 2>", "<insight 3>"],
  "content_gaps": "<1-2 sentences on what they're not posting enough of>",
  "verdict": "<one punchy strategic line — direct, not fluffy>",
  "post_ideas": [
    {
      "title": "<short topic name>",
      "hook": "<opening line for the post>",
      "angle": "<what to say and why it matters to THIS audience>",
      "format": "<carousel | text | poll | video | document>",
      "why_it_works": "<tie to their analytics — be specific>"
    }
  ]
}

Provide exactly 6 post_ideas, ranked by likely engagement for this audience. Be specific to the data you see — no generic 'share your journey' advice.`;
}

export default async function handler(req, res) {
  return analyzeImages(req, res, {
    buildPrompt,
    maxTokens: 4096,
    temperature: 0.7,
    getNotes: body => body?.notes,
  });
}
