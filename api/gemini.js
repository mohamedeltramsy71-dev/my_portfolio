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
4. Smart Contract RAG Assistant — LangChain + FastAPI + ChromaDB + Groq for legal document Q&A.

RULES:
- Keep answers concise (2-4 sentences max)
- If asked something you don't know, suggest contacting Mohamed via the contact form
- Be warm but professional`;

  // Convert messages to Gemini format
  // Gemini uses "user" and "model" roles (not "assistant")
  const geminiContents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: geminiContents,
        generationConfig: {
          maxOutputTokens: 400,
          temperature: 0.7,
        },
      }),
    }
  );

  const data = await response.json();

  // Extract text from Gemini response
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    ?? "Hmm, couldn't get a response — try again!";

  res.status(200).json({ text });
}