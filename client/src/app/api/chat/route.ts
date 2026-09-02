import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        reply: "Sorry, the AI Stylist is currently unavailable. Please ask the administrator to configure the GEMINI_API_KEY." 
      });
    }

    // Fetch products context to feed the AI
    let productsContext = "No specific products found right now, but you can still give general advice.";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout (Render can be slow)
      
      const response = await fetch('https://eyevengers-web.onrender.com/api/admin/products', {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const products = await response.json();
        const simplifiedProducts = (products || []).map((p: any) => {
          const hasDiscount = p.sku && p.sku.includes('|DISCOUNT:');
          const hasShape = p.sku && p.sku.includes('|SHAPE:');
          const discountPercent = hasDiscount ? Number(p.sku.split('|DISCOUNT:')[1].split('|')[0]) : 0;
          const shapeVal = hasShape ? p.sku.split('|SHAPE:')[1].split('|')[0] : '';
          const originalPrice = discountPercent > 0 ? Math.round(p.price / (1 - (discountPercent / 100))) : p.price;
          
          return `- **${p.name}** (Category: ${p.category}, Brand: ${p.brand || 'Generic'}, Shape: ${shapeVal || 'Standard'}, Gender: ${p.gender || 'Unisex'}). Selling Price: ₹${p.price} (Original MRP: ₹${originalPrice}, Discount: ${discountPercent}% OFF). Stock: ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}.`;
        }).join('\n');
        
        productsContext = `Here is the LIVE catalog of all available products in the store right now:\n${simplifiedProducts}`;
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
1. ONLY recommend products from the live catalog provided below. Do NOT make up any product names or prices.
2. If a user asks for "fayde wali deal" or offers, find products from the list that have the highest Discount % and recommend them enthusiastically.
3. When you recommend a specific product, YOU MUST ALWAYS format its name as a Markdown link pointing to the products page so the user can click it. Format: [Product Name](/products). For example: "Aapke liye [Square Matt](/products) best rahega, jo ki ₹999 ka hai!"
4. Keep your answers concise, scannable, and use bullet points when listing products.

LIVE STORE CATALOG:
${productsContext}
`;

    // Construct the payload for Gemini REST API
    const contents = [
      ...history.map((msg: any) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: msg.parts
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const geminiPayload = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: contents,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    };

    // Use native fetch to bypass SDK key format issues (the new AQ. keys expect header auth)
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(geminiPayload)
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('Gemini REST Error:', data);
      throw new Error(data.error?.message || 'Failed to generate response from Gemini');
    }

    const responseText = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ reply: responseText });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        reply: `I'm having a little trouble connecting right now. (Error: ${error?.message || 'Unknown'})` 
      },
      { status: 500 }
    );
  }
}
