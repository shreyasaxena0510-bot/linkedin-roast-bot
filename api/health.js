import { getGeminiModel, getGoogleApiKey, getModelChain } from './lib/gemini.js';

export default function handler(req, res) {
  const hasKey = Boolean(getGoogleApiKey());
  return res.status(200).json({
    ok: hasKey,
    google_configured: hasKey,
    model: getGeminiModel(),
    fallback_models: getModelChain().slice(1),
  });
}
