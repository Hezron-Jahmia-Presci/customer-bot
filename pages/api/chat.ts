import type { NextApiRequest, NextApiResponse } from 'next';
import { getBotReply, ChatMessage } from '@/lib/openai';
import { supabase } from '@/lib/supabase';

type Intent = 'billing' | 'support' | 'general' | 'escalate';

function detectIntent(message: string): Intent {
  const text = message.toLowerCase();

  if (/price|invoice|payment/.test(text)) return 'billing';
  if (/error|issue|not working|problem/.test(text)) return 'support';
  if (/hello|hi|hey|thanks|thank you|help|good morning|good evening/.test(text)) return 'general';
  if (/human|agent|not helpful|escalate|speak to someone|talk to agent/.test(text)) return 'escalate';

  return 'general'; // safest fallback
}

const systemPromptMap: Record<Intent, string> = {
  billing: 'You are a helpful billing assistant named Megan. Answer clearly about pricing, payments, and invoices.',
  support: 'You are a technical support assistant named Megan. Guide users politely through issues or errors.',
  general: 'You are a friendly chatbot named Megan. Greet users and answer general questions.',
  escalate: 'You are a polite assistant who forwards conversations requiring escalation to a human.',
};

// In-memory chat memory (short-term). For production, use Redis or a DB.
const chatMemory: Record<string, ChatMessage[]> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, email, name } = req.body;

  if (!message || typeof message !== 'string' || !email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid message/email' });
  }

  const sanitizedMessage = message.trim();
  const sanitizedEmail = email.trim();
  const sanitizedName = name?.trim() || 'Unknown User';
  const intent = detectIntent(sanitizedMessage);

  // Initialize memory if not present
  if (!chatMemory[sanitizedEmail]) {
    chatMemory[sanitizedEmail] = [
      { role: 'system', content: systemPromptMap[intent] },
    ];
  }

  // Add user message to memory
  chatMemory[sanitizedEmail].push({ role: 'user', content: sanitizedMessage });

  // Handle escalation
  if (intent === 'escalate') {
    try {
      await supabase.from('escalations').insert([
        {
          user_email: sanitizedEmail,
          name: sanitizedName,
          latest_message: sanitizedMessage,
          chat_snapshot: JSON.stringify(chatMemory[sanitizedEmail]),
        },
      ]);
    } catch (err) {
      console.error('❌ Supabase escalation save error:', err);
    }

    const webhookUrl = process.env.ESCALATION_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: sanitizedEmail,
            name: sanitizedName,
            message: sanitizedMessage,
            history: chatMemory[sanitizedEmail],
          }),
        });
      } catch (err) {
        console.error('❌ Webhook send error:', err);
      }
    }

    return res.status(200).json({
      reply: 'Let me connect you to a human agent for better assistance. Please hold on...',
    });
  }

  try {
    const reply = await getBotReply(chatMemory[sanitizedEmail]);
    chatMemory[sanitizedEmail].push({ role: 'assistant', content: reply });

    // Store chat log
    await supabase.from('chat_logs').insert([
      {
        user_email: sanitizedEmail,
        name: sanitizedName,
        role: 'user',
        message: sanitizedMessage,
        intent,
      },
      {
        user_email: sanitizedEmail,
        name: sanitizedName,
        role: 'assistant',
        message: reply,
        intent,
      },
    ]);

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('❌ getBotReply error:', err);
    return res.status(500).json({ error: 'Something went wrong while processing your message.' });
  }
}
