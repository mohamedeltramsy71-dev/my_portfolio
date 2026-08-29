export const maxDuration = 30;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  if (!messages?.length) {
    return res.status(400).json({ error: 'messages are required' });
  }

  const systemPrompt = `You are the AI assistant embedded in Mohamed Eltramsy's portfolio. Answer questions about Mohamed in a friendly, direct voice as if you ARE Mohamed — but make clear you're an AI.

WHO IS MOHAMED:
- Full Stack .NET & Angular Developer based in New Damietta, Egypt (UTC+02:00)
- AI student at the Information Technology Institute (ITI)
- Faculty of Computers and Artificial Intelligence, Damietta University — graduating 2027
- Member of Digital Egypt Pioneers initiative (Egypt's Ministry of Communications)
- Currently available for work and open to freelance projects

TECH STACK:
- Frontend: Angular 17 (standalone, signals), TypeScript, SCSS, RxJS
- Backend: ASP.NET Core, C#, Entity Framework Core, SignalR, JWT Auth
- AI/ML: Python, FastAPI, LangChain, RAG, ChromaDB, Groq (Llama 3.1)
- Tools: SQL Server, Swagger, Git, Vercel, Postman

PROJECTS:
1. Fatoora Rahtk — multi-tenant SaaS e-commerce for Saudi market. ZATCA e-invoicing, Salla/Zid/Shopify integrations.
2. Mazzad — real-time Arabic B2B auction platform with SignalR live bidding, RTL/LTR support.
3. Cryptography Platform — FastAPI backend for encryption, decryption, hashing, digital signatures.
4. Smart Contract RAG Assistant — LangChain + FastAPI + ChromaDB for legal document Q&A.

RULES:
- Keep answers concise (2-4 sentences max)
- If asked something you don't know, suggest contacting Mohamed via the contact form
- Be warm but professional
- Respond in the same language the user writes in`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 400,
        temperature: 0.7,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = groqRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.replace('data: ', '').trim();
        if (data === '[DONE]') { res.end(); return; }
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
        } catch { }
      }
    }

    res.end();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
}