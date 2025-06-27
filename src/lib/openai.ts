export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function getBotReply(history: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('❌ Missing GROQ_API_KEY');
    return 'Missing API key.';
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: history,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || 'No response from AI.';
  } catch (error) {
    console.error('❌ Groq error:', error);
    return 'Error talking to AI.';
  }
}
