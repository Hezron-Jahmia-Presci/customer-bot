export async function getBotReply(userMessage: string): Promise<string> {
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
          model: 'llama3-70b-8192', // ✅ high-quality, free
          messages: [
            { role: 'system', content: 'You are a helpful customer service assistant named Megan. Be polite and clear.' },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
        }),
      });
  
      const data = await response.json();
      console.log('🧠 Groq Response:', data);
      return data.choices?.[0]?.message?.content?.trim() || 'No response from AI.';
    } catch (error) {
      console.error('❌ Groq error:', error);
      return 'Error talking to AI.';
    }
  }
  