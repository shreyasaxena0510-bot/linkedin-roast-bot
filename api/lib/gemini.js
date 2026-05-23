// Dashboard labels (e.g. "Gemini 1.5 Flash Lite") ≠ API model IDs.
// Lite models (*-flash-lite) do NOT support image input — use flash (non-lite) for screenshots.
// Override in .env.local: GEMINI_MODEL=gemini-2.5-flash
const DEFAULT_MODEL = 'gemini-2.5-flash';

const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash',
];

export function getGeminiModel() {
  return (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();
}

export function getModelChain() {
  const preferred = getGeminiModel();
  return [...new Set([preferred, ...FALLBACK_MODELS])];
}

export function getGoogleApiKey() {
  return (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '').trim();
}

function parseDataUrl(url) {
  const match = String(url).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image format. Re-upload the screenshot.');
  }
  return { mimeType: match[1], data: match[2] };
}

function imageParts(images) {
  return images.map(url => {
    const { mimeType, data } = parseDataUrl(url);
    return { inlineData: { mimeType, data } };
  });
}

function buildGenerationConfig({ model, maxTokens, temperature }) {
  const config = {
    temperature,
    maxOutputTokens: maxTokens,
    responseMimeType: 'application/json',
  };
  // 2.5/3.x models use thinking tokens by default, which truncates JSON output.
  if (/gemini-2\.5|gemini-3/.test(model)) {
    config.thinkingConfig = { thinkingBudget: 0 };
  }
  return config;
}

function parseJsonFromText(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('invalid json');
  }
}

function isQuotaError(status, message) {
  if (status === 429) return true;
  const m = String(message || '').toLowerCase();
  return m.includes('quota') || m.includes('rate limit') || m.includes('resource exhausted');
}

function isModelNotFoundError(status, message) {
  if (status === 404) return true;
  const m = String(message || '').toLowerCase();
  return m.includes('not found') || m.includes('not supported for generatecontent');
}

function shouldTryNextModel(err) {
  return err.quota || err.modelNotFound || err.invalidJson;
}

async function callGeminiOnce({ apiKey, model, prompt, images, maxTokens, temperature }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }, ...imageParts(images)],
      }],
      generationConfig: buildGenerationConfig({ model, maxTokens, temperature }),
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message || 'Google Gemini API error';
    const err = new Error(message);
    err.status = res.status;
    err.quota = isQuotaError(res.status, message);
    err.modelNotFound = isModelNotFoundError(res.status, message);
    throw err;
  }

  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts || [])
    .map(part => part.text || '')
    .join('')
    .trim();

  if (!text) {
    const blockReason = candidate?.finishReason;
    const err = new Error(
      blockReason === 'SAFETY'
        ? 'Image was blocked by safety filters. Try a different screenshot.'
        : 'Model returned an empty response. Try again.'
    );
    err.status = 502;
    if (blockReason === 'MAX_TOKENS') err.invalidJson = true;
    throw err;
  }

  try {
    return parseJsonFromText(text);
  } catch {
    const err = new Error(
      candidate?.finishReason === 'MAX_TOKENS'
        ? 'Response was cut off (token limit). Try 1–2 screenshots instead of 4.'
        : 'Model returned invalid JSON. Try again with fewer or smaller screenshots.'
    );
    err.status = 502;
    err.invalidJson = true;
    throw err;
  }
}

export async function callGeminiVision({
  apiKey,
  prompt,
  images,
  maxTokens = 4096,
  temperature = 0.8,
}) {
  const models = getModelChain();
  let lastRetryableErr = null;

  for (const model of models) {
    try {
      return await callGeminiOnce({ apiKey, model, prompt, images, maxTokens, temperature });
    } catch (err) {
      if (shouldTryNextModel(err)) {
        lastRetryableErr = err;
        continue;
      }
      throw err;
    }
  }

  const err = new Error(
    lastRetryableErr?.message
      || 'All Gemini models failed. Set GEMINI_MODEL=gemini-2.5-flash in .env.local and restart vercel dev.'
  );
  err.status = lastRetryableErr?.status || 429;
  throw err;
}

export function validateImages(images) {
  if (!Array.isArray(images) || !images.length || images.length > 4) {
    return 'Send 1 to 4 images';
  }
  return null;
}
