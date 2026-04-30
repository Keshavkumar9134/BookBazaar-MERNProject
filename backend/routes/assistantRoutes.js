const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const Book = require('../models/Book');
const User = require('../models/User');
const Order = require('../models/Order');

const router = express.Router();

const assistantInstructions = `
You are the BookGenie website assistant.
Help users understand and use the BookGenie website clearly and politely.
Focus on BookGenie features such as:
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
- If the user asks something unrelated to BookGenie, gently say you are the BookGenie helper and bring the answer back to the website.
- If the user asks how to order a book, first explain the normal ordering steps, then offer help by saying you can help place the order here if they want.
`.trim();

const isAffirmative = (text) => /^(yes|yep|yeah|sure|ok|okay|please do|go ahead|help me|yes please)\b/i.test(text.trim());
const isNegative = (text) => /^(no|nope|nah|cancel|stop|not now)\b/i.test(text.trim());
const isOrderHowToQuestion = (text) =>
  /(how to order|how can i order|how do i order|how to buy|how can i buy|place order)/i.test(text);
const isOrderIntentQuestion = (text) =>
  /(order|buy|purchase|add to cart|get me|want .*book)/i.test(text);

const sanitizeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findBooksByQuery = async (query) => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const exactMatches = await Book.find({
    title: { $regex: `^${sanitizeRegex(trimmed)}$`, $options: 'i' },
  })
    .sort({ quantity: -1, createdAt: -1 })
    .limit(5);

  if (exactMatches.length) {
    return exactMatches;
  }

  return Book.find({
    title: { $regex: sanitizeRegex(trimmed), $options: 'i' },
  })
    .sort({ quantity: -1, createdAt: -1 })
    .limit(5);
};

const getSellPrice = (book) =>
  book.salePrice && book.salePrice < book.price ? book.salePrice : book.price;

const normalizeSavedAddress = (savedAddress) => {
  if (!savedAddress || typeof savedAddress !== 'object') {
    return null;
  }

  const addressText = String(savedAddress.addressText || '').trim();
  if (!addressText) {
    return null;
  }

  return {
    addressText,
    latitude: typeof savedAddress.latitude === 'number' ? savedAddress.latitude : null,
    longitude: typeof savedAddress.longitude === 'number' ? savedAddress.longitude : null,
    accuracy: typeof savedAddress.accuracy === 'number' ? savedAddress.accuracy : null,
    source: savedAddress.source || 'saved-checkout-address',
    placeName: savedAddress.placeName || '',
  };
};

const placeAssistantOrder = async ({ userId, bookId, quantity, savedAddress, paymentMethod }) => {
  const book = await Book.findById(bookId);
  if (!book) {
    throw new Error('Selected book is no longer available.');
  }

  if (book.quantity < quantity) {
    throw new Error(`Only ${book.quantity} copies of ${book.title} are available right now.`);
  }

  const unitPrice = getSellPrice(book);
  const total = unitPrice * quantity;

  book.quantity -= quantity;
  await book.save();

  const order = new Order({
    userId,
    items: [
      {
        bookId: book._id,
        quantity,
        price: unitPrice,
      },
    ],
    total,
    deliveryLocation: {
      latitude: savedAddress.latitude,
      longitude: savedAddress.longitude,
      accuracy: savedAddress.accuracy,
      source: savedAddress.source,
      placeName: savedAddress.placeName || '',
      addressText: savedAddress.addressText,
      capturedAt: new Date(),
    },
    paymentMethod,
    paymentStatus: paymentMethod === 'online' ? 'paid-online' : 'cod-pending',
  });

  await order.save();

  return { order, book, total };
};

const handleOrderAssistant = async (userText, state, userId, savedAddress) => {
  if (state?.mode === 'awaiting-order-consent') {
    if (isAffirmative(userText)) {
      if (!savedAddress) {
        return {
          replies: [
            'I can help place the order for you, but first save a delivery address in Checkout.',
            'After that, come back here and ask again.',
          ],
          state: null,
        };
      }

      return {
        replies: [
          `The order will be delivered to your saved address: ${savedAddress.addressText}.`,
          'Tell me the book name you want to order.',
        ],
        state: { mode: 'awaiting-book' },
      };
    }

    if (isNegative(userText)) {
      return {
        replies: ['No problem. If you want ordering help later, just ask me anytime.'],
        state: null,
      };
    }
  }

  if (!state && isOrderIntentQuestion(userText) && !isOrderHowToQuestion(userText)) {
    if (!savedAddress) {
      return {
        replies: [
          'I can help place the order for you, but first save a delivery address in Checkout.',
          'After that, tell me the book name you want.',
        ],
        state: null,
      };
    }

    return {
      replies: ['Sure.', 'Tell me the book name you want to order.'],
      state: { mode: 'awaiting-book' },
    };
  }

  if (state?.mode === 'awaiting-book') {
    const matches = await findBooksByQuery(userText);

    if (!matches.length) {
      return {
        replies: ['I could not find that book. Please send the exact book title you want to order.'],
        state,
      };
    }

    if (matches.length > 1) {
      const options = matches.map((book) => book.title).join(', ');
      return {
        replies: [`I found multiple books: ${options}. Please reply with the exact book title you want.`],
        state,
      };
    }

    const [book] = matches;

    if (book.quantity <= 0) {
      return {
        replies: [
          `${book.title} is currently sold out.`,
          'You can send another book name and I will help with that one.',
        ],
        state: { mode: 'awaiting-book' },
      };
    }

    return {
      replies: [`I found ${book.title}. How many copies do you want? Available stock: ${book.quantity}.`],
      state: {
        mode: 'awaiting-quantity',
        bookId: String(book._id),
        bookTitle: book.title,
        availableQuantity: book.quantity,
        unitPrice: getSellPrice(book),
      },
    };
  }

  if (state?.mode === 'awaiting-quantity') {
    const quantityMatch = userText.match(/\d+/);
    const quantity = quantityMatch ? Number(quantityMatch[0]) : NaN;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return {
        replies: ['Please send a valid quantity like 1 or 2.'],
        state,
      };
    }

    if (quantity > state.availableQuantity) {
      return {
        replies: [`Only ${state.availableQuantity} copies of ${state.bookTitle} are available. Please choose a smaller quantity.`],
        state,
      };
    }

    return {
      replies: [`Great. Which payment method do you want for ${state.bookTitle}: Cash on Delivery or Online Payment?`],
      state: {
        ...state,
        mode: 'awaiting-payment-method',
        quantity,
      },
    };
  }

  if (state?.mode === 'awaiting-payment-method') {
    const normalized = userText.toLowerCase();
    let paymentMethod = null;

    if (normalized.includes('cod') || normalized.includes('cash')) {
      paymentMethod = 'cod';
    } else if (normalized.includes('online')) {
      paymentMethod = 'online';
    }

    if (!paymentMethod) {
      return {
        replies: ['Please choose one payment method: Cash on Delivery or Online Payment.'],
        state,
      };
    }

    return {
      replies: [
        `Please confirm this order: ${state.quantity} ${state.quantity > 1 ? 'copies' : 'copy'} of ${state.bookTitle}.`,
        `Payment method: ${paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}.`,
        `Delivery address: ${savedAddress.addressText}.`,
        'Reply yes to place the order or no to cancel.',
      ],
      state: {
        ...state,
        mode: 'awaiting-final-confirmation',
        paymentMethod,
      },
    };
  }

  if (state?.mode === 'awaiting-final-confirmation') {
    if (isAffirmative(userText)) {
      try {
        const { book } = await placeAssistantOrder({
          userId,
          bookId: state.bookId,
          quantity: state.quantity,
          savedAddress,
          paymentMethod: state.paymentMethod,
        });

        return {
          replies: [
            'Order placed successfully!',
            `${state.quantity} ${state.quantity > 1 ? 'copies' : 'copy'} of ${book.title} will be delivered to your saved address.`,
            `Payment method: ${state.paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}.`,
          ],
          state: null,
          alert: 'Order placed successfully!',
        };
      } catch (error) {
        return {
          replies: [error.message || 'I could not place the order right now.'],
          state: null,
        };
      }
    }

    if (isNegative(userText)) {
      return {
        replies: ['Okay, I cancelled this order request. If you want to start again, just send the book name.'],
        state: null,
      };
    }
  }

  return null;
};

router.post('/assistant/chat', authMiddleware, async (req, res) => {
  const history = Array.isArray(req.body.messages) ? req.body.messages : [];
  const assistantState =
    req.body.assistantState && typeof req.body.assistantState === 'object'
      ? req.body.assistantState
      : null;
  const savedAddress = normalizeSavedAddress(req.body.savedAddress);
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

  const latestUserMessage = [...cleanedHistory].reverse().find((message) => message.role === 'user');

  if (!latestUserMessage) {
    return res.status(400).json({ message: 'A user message is required.' });
  }

  const orderAssistantResult = await handleOrderAssistant(
    latestUserMessage.content,
    assistantState,
    req.user.id,
    savedAddress
  );

  if (orderAssistantResult) {
    return res.json({
      replies: orderAssistantResult.replies || [orderAssistantResult.reply].filter(Boolean),
      source: 'order-assistant',
      assistantState: orderAssistantResult.state,
      alert: orderAssistantResult.alert || null,
    });
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

    const shouldOfferOrdering =
      isOrderHowToQuestion(latestUserMessage.content) &&
      !/i can help place the order for you/i.test(reply);

    res.json({
      replies: shouldOfferOrdering
        ? [
            reply,
            `Would you like me to help you place an order right here? If you want, I can help place the order for you here. Just say yes.`,
          ]
        : [reply],
      responseId: data?.responseId || null,
      source: 'gemini',
      assistantState: shouldOfferOrdering ? { mode: 'awaiting-order-consent' } : null,
      alert: null,
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
