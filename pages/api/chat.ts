import type { NextApiRequest, NextApiResponse } from 'next';
import { getBotReply } from '@/lib/openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message format' });
  }

  try {
    const reply = await getBotReply(message);
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat handler error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
