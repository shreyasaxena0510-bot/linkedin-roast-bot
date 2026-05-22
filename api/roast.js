const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

function buildPrompt(count) {
  const label = count === 1 ? 'screenshot' : `${count} screenshots`;
  return `You are a brutally honest recruiter who has seen thousands of LinkedIn profiles.
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server missing GROQ_API_KEY' });
  }

  const { images } = req.body || {};
  if (!Array.isArray(images) || !images.length || images.length > 4) {
    return res.status(400).json({ error: 'Send 1 to 4 images' });
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 1024,
        temperature: 0.8,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: buildPrompt(images.length) },
            ...images.map(url => ({ type: 'image_url', image_url: { url } })),
          ],
        }],
      }),
    });

    const data = await groqRes.json();
    if (!groqRes.ok) {
      return res.status(groqRes.status).json({
        error: data?.error?.message || 'Groq API error',
      });
    }

    const text = (data.choices?.[0]?.message?.content || '')
      .replace(/```json|```/g, '')
      .trim();

    return res.status(200).json(JSON.parse(text));
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}