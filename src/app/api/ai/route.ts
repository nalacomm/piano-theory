import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages, system } = await req.json();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system,
      messages,
    });
    const text = response.content.find(b => b.type === 'text')?.text ?? '';
    return NextResponse.json({ text });
  } catch (err) {
    console.error('AI route error:', err);
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
  }
}
