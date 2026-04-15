import axios from 'axios';
import type {
  ApiList,
  ChatResponse,
  SearchHit,
  SourceCitation,
  TranscriptChunk,
  VideoMetadata,
} from '@/types/api';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  timeout: 120000,
});

export async function processVideo(url: string) {
  const response = await api.post<{ video: VideoMetadata; transcript_source: string; chunk_count: number; status: string }>('/process-video', { url });
  return response.data;
}

export async function fetchTranscript(videoId: string) {
  const response = await api.get<{ video: VideoMetadata; transcript_source: string; transcript_text: string; chunks: TranscriptChunk[] }>(`/transcript/${videoId}`);
  return response.data;
}

export async function sendChat(payload: Record<string, unknown>) {
  const response = await api.post<ChatResponse>('/chat', payload);
  return response.data;
}

export async function generateSummary(payload: { video_id: string; mode: string }) {
  const response = await api.post('/summary', payload);
  return response.data as { mode: string; summary: string; sources: SourceCitation[] };
}

export async function generateQuiz(payload: { video_id: string; difficulty: string; count: number; format: string }) {
  const response = await api.post('/quiz', payload);
  return response.data as { difficulty: string; format: string; quiz: string; sources: SourceCitation[] };
}

export async function generateNotes(payload: { video_id: string; style: string }) {
  const response = await api.post('/notes', payload);
  return response.data as { style: string; notes: string; sources: SourceCitation[] };
}

export async function generateStudyMode(videoId: string) {
  const response = await api.post('/study', null, { params: { video_id: videoId } });
  return response.data as { study_mode: string; sources: SourceCitation[] };
}

export async function generateFlashcards(videoId: string, count = 8) {
  const response = await api.post('/flashcards', { video_id: videoId, count });
  return response.data as { items: Array<{ front: string; back: string; hint: string }>; sources: SourceCitation[] };
}

export async function searchTranscript(query: string, limit = 8, videoId?: string) {
  const response = await api.get<{ query: string; results: SearchHit[] }>('/search', { params: { query, limit, video_id: videoId } });
  return response.data;
}

export async function getHistory() {
  const response = await api.get<ApiList<{ conversation_id: string; video_id?: string; collection_id?: string; question: string; answer: string; created_at: string }>>('/history');
  return response.data.items;
}

export async function getCollections() {
  const response = await api.get<ApiList<{ id: string; name: string; description: string; video_ids: string[]; created_at: string }>>('/collections');
  return response.data.items;
}

export async function getVideos() {
  const response = await api.get<ApiList<VideoMetadata>>('/videos');
  return response.data.items;
}

export async function getStats() {
  const response = await api.get<{ videos_processed: number; questions_asked: number; study_hours: number; quiz_score: number; collections: number; bookmarks: number }>('/stats');
  return response.data;
}

export async function createCollection(payload: { name: string; description: string; video_ids: string[] }) {
  const response = await api.post('/collections', payload);
  return response.data as { id: string; name: string; description: string; video_ids: string[]; created_at: string };
}

export async function createBookmark(payload: { target_type: 'answer' | 'transcript' | 'timestamp'; target_id: string; label: string }) {
  const response = await api.post('/bookmarks', payload);
  return response.data as { id: string; target_type: string; target_id: string; label: string; created_at: string };
}

