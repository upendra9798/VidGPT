export type StreamEvent =
  | { type: 'meta'; conversation_id: string; sources: unknown[]; suggested_questions: string[] }
  | { type: 'token'; content: string }
  | { type: 'final'; answer: string; confidence: number; sources: unknown[]; conversation_id: string; suggested_questions: string[] };

export async function streamChatResponse(
  url: string,
  payload: Record<string, unknown>,
  handlers: {
    onMeta?: (event: Extract<StreamEvent, { type: 'meta' }>) => void;
    onToken?: (token: string) => void;
    onFinal?: (event: Extract<StreamEvent, { type: 'final' }>) => void;
  },
) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Streaming request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      const line = part.split('\n').find((entry) => entry.startsWith('data:'));
      if (!line) continue;
      const data = JSON.parse(line.replace(/^data:\s*/, '')) as StreamEvent;
      if (data.type === 'meta' && handlers.onMeta) handlers.onMeta(data);
      if (data.type === 'token' && handlers.onToken) handlers.onToken(data.content);
      if (data.type === 'final' && handlers.onFinal) handlers.onFinal(data);
    }
  }
}
