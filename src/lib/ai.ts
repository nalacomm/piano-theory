export async function askTutor(userMessage: string, systemPrompt?: string): Promise<string> {
  const system = systemPrompt ?? `You are a piano and music theory tutor. The user is an experienced ear player with ~30 years on piano. Very fluent with the number system (1, ♭3, 4, ♭7, etc). Doesn't read music fluently. Keep answers concise, practical, piano-specific. Always use number system language. Note names over staff notation. No lengthy preamble.`;
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: userMessage }], system }),
  });
  if (!res.ok) throw new Error('AI request failed');
  const data = await res.json();
  return data.text;
}

export async function getReteachExplanation(weakAreas: string[], wrongQuestions: string[]): Promise<string> {
  const prompt = `You are a piano theory tutor. The student is an experienced ear player with 30 years on piano, very fluent with the number system. They don't read music fluently.

Their weak areas: ${weakAreas.join(', ') || 'none identified yet'}.
Questions they got wrong: ${wrongQuestions.join('; ') || 'none yet'}.

TASK: Teach the concept from a completely fresh angle. Don't repeat the same explanation. Use:
- Real musical examples they'd know (songs, artists, genres)
- Number system language (♭7, II chord, etc.)
- An analogy or story that makes it stick
- A practical "try this on piano" tip they can visualize without a piano in front of them

Keep it under 200 words. Be direct and punchy. No filler.`;
  return askTutor(prompt);
}
