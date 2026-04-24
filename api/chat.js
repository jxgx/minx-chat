// api/chat.js
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, systemPrompt, temperature, maxTokens, history } = req.body;
    
    // Debugging logs (check your Vercel function logs)
    console.log("📥 Received systemPrompt length:", systemPrompt?.length);

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Construct messages array
    const messages = [
      { role: "system", content: systemPrompt || "You are a helpful assistant." },
      ...(history || []),
      { role: "user", content: message }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        // OpenRouter allows you to identify your app
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000', 
        'X-Title': 'Minx Chat',
      },
      body: JSON.stringify({
        model: 'sao10k/l3.3-euryale-70b',
        messages: messages,
        temperature: temperature ?? 0.9,
        max_tokens: maxTokens ?? 1200, // Ensure backend respects the higher token limit
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    const reply = data.choices[0].message.content;
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: error.message });
  }
};
