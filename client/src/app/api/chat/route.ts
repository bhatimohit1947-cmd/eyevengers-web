import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        reply: "Sorry, the AI Stylist is currently unavailable. Please ask the administrator to configure the GEMINI_API_KEY." 
      });
    }

    // Fetch products context to feed the AI
    let productsContext = "No specific products found right now, but you can still give general advice.";
    try {
      const response = await fetch('https://eyevengers-web.onrender.com/api/products');
      if (response.ok) {
        const products = await response.json();
        const simplifiedProducts = products.map((p: any) => 
          `- ${p.name} (Shape: ${p.shape || 'Standard'}, Material: ${p.material || 'Standard'}, Price: ₹${p.price || p.basePrice || 1000}) - Ideal for ${p.idealFor || 'everyone'}.`
        ).join('\n');
        productsContext = `Here are the currently available products in the store:\n${simplifiedProducts}`;
      }
    } catch (e) {
      console.warn("Could not fetch products for AI context", e);
    }

    const systemInstruction = `
You are the "Vision AI Stylist" for Eyevengers, a premium eyewear brand.
You speak in a friendly, professional, and empathetic tone.
You MUST speak in Hindi, English, or Hinglish depending on how the user speaks to you. If they say "hi, mujhe chasma chahiye", reply in Hinglish.
Your main job is to help users find the perfect glasses based on their face shape, needs, or budget. 
You also explain lens types (like anti-glare, blue-cut, bifocal, progressive) simply.
IMPORTANT RULES:
1. Only recommend products from the list provided below. Do not make up product names.
2. If a user asks for something outside of eyewear, politely redirect them back to eyewear.
3. Keep your answers concise, scannable, and use bullet points when listing products. Use markdown for bolding **important words**.

${productsContext}
`;

    // Initialize the model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction 
    });

    // Start a chat session with history
    const chat = model.startChat({
      history: history.map((msg: any) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: msg.parts,
      })),
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    // Send the new message
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', reply: "I'm having a little trouble connecting right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
