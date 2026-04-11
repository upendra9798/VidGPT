export type VideoMetadata = {
  video_id: string;
  url: string;
  title: string;
  channel: string;
  duration: number;
  thumbnail: string;
  description: string;
  processed_at: string;
};

export type TranscriptChunk = {
  chunk_id: string;
  video_id: string;
  text: string;
  start_time: number;
  end_time: number;
  duration: number;
  order_index: number;
};

export type SourceCitation = {
  video_id: string;
  title: string;
  timestamp: number;
  snippet: string;
  similarity: number;
};

export type SearchHit = {
  chunk_id: string;
  video_id: string;
  title: string;
  timestamp: number;
  text: string;
  score: number;
};

export type ChatResponse = {
  answer: string;
  confidence: number;
  sources: SourceCitation[];
  conversation_id: string;
  suggested_questions: string[];
  answer_markdown: string;
};

export type ApiList<T> = { items: T[] };
