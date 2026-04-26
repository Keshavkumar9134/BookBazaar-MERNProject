const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

const assistantInstructions = `
You are the BookBazaar website assistant.
Help users understand and use the BookBazaar website clearly and politely.
Focus on BookBazaar features such as:
- browsing books from the Shop page
- adding books to Cart
- checkout, delivery address, and payment methods
- orders and order history
- contacting admin support from Contact > Wants Some Help
- connecting with other verified users from the Contact page
- login and registration
- sales, newest books, genres, Home, and About Us

Rules:
- Keep replies short, direct, and beginner-friendly.
- If the user asks how to do something on the website, answer as step-by-step guidance in plain language.
- If the website does not appear to support a feature directly, say that clearly and suggest contacting support.
- Do not invent discounts, policies, or features that were not mentioned.
- If the user asks something unrelated to BookBazaar, gently say you are the BookBazaar helper and bring the answer back to the website.
`.trim();

router.post('/assistant/chat', authMiddleware, async (req, res) => {
  const history = Array.isArray(req.body.messages) ? req.body.messages : [];
  const cleanedHistory = history
    .filter((message) => message && (message.role === 'user' || message.role === 'assistant'))
    .map((message) => ({
      role: message.role,
      content: String(message.text || '').trim(),
    }))
    .filter((message) => message.content);

  if (cleanedHistory.length === 0) {
    return res.status(400).json({ message: 'At least one assistant message is required.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      message: 'Gemini is not configured yet. Add GEMINI_API_KEY to your backend environment.',
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${
        process.env.GEMINI_MODEL || 'gemini-2.5-flash'
      }:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: assistantInstructions }],
          },
          contents: cleanedHistory.map((message) => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }],
          })),
          generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || 'Gemini request failed.');
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim() || '';

    if (!reply) {
      return res.status(502).json({ message: 'Gemini returned an empty response.' });
    }

    res.json({
      reply,
      responseId: data?.responseId || null,
      source: 'gemini',
    });
  } catch (error) {
    res.status(502).json({
      message:
        error?.error?.message ||
        error?.message ||
        'Gemini failed to generate a response.',
    });
  }
});

module.exports = router;
