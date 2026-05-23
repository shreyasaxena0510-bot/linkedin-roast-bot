import { callGeminiVision, getGoogleApiKey, validateImages } from './gemini.js';

export async function analyzeImages(req, res, { buildPrompt, maxTokens, temperature, getNotes }) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    return res.status(500).json({
      error: 'Server missing GOOGLE_API_KEY',
      code: 'missing_api_key',
      hint: 'Add GOOGLE_API_KEY to .env.local (local) or Vercel project Settings → Environment Variables, then restart vercel dev. Get a key at https://aistudio.google.com/apikey',
    });
  }

  const { images } = req.body || {};
  const imageError = validateImages(images);
  if (imageError) {
    return res.status(400).json({ error: imageError });
  }

  try {
    const notes = getNotes?.(req.body);
    const result = await callGeminiVision({
      apiKey,
      prompt: buildPrompt(images.length, notes),
      images,
      maxTokens,
      temperature,
    });
    return res.status(200).json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Server error' });
  }
}
