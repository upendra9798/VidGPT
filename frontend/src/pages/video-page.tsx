import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Copy, ExternalLink, Send, Sparkles, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api, fetchTranscript, generateFlashcards, generateNotes, generateQuiz, generateStudyMode, generateSummary } from '@/services/api';
import { streamChatResponse } from '@/services/stream';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TranscriptChunk } from '@/types/api';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type Flashcard = { front: string; back: string; hint: string };

function formatTimestamp(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function youtubeUrl(videoId: string, seconds: number) {
  return `https://youtube.com/watch?v=${videoId}&t=${Math.max(0, Math.floor(seconds))}`;
}

function deriveFlashcards(markdown: string) {
  return markdown
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((line, index) => ({ front: `Card ${index + 1}`, back: line, hint: '' }));
}

export function VideoPage() {
  const { videoId = '' } = useParams();
  const [activeTab, setActiveTab] = useState('chat');
  const [question, setQuestion] = useState('What are the key ideas?');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [liveAnswer, setLiveAnswer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [summaryMode, setSummaryMode] = useState<'quick' | 'detailed' | 'bullet' | 'takeaways' | 'exam' | 'interview'>('quick');
  const [quizFormat, setQuizFormat] = useState<'mcq' | 'short' | 'flashcards' | 'true_false' | 'coding' | 'interview'>('mcq');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const chatBottom = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const transcriptQuery = useQuery({ queryKey: ['transcript', videoId], queryFn: () => fetchTranscript(videoId), enabled: Boolean(videoId) });

  const summaryMutation = useMutation({ mutationFn: generateSummary });
  const quizMutation = useMutation({ mutationFn: generateQuiz });
  const notesMutation = useMutation({ mutationFn: generateNotes });
  const studyMutation = useMutation({ mutationFn: generateStudyMode });
  const flashcardsMutation = useMutation({ mutationFn: (count: number) => generateFlashcards(videoId, count) });

  useEffect(() => {
    chatBottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveAnswer]);

  const filteredChunks = useMemo(() => {
    const chunks = transcriptQuery.data?.chunks ?? [];
    if (!searchTerm) return chunks;
    const needle = searchTerm.toLowerCase();
    return chunks.filter((chunk: TranscriptChunk) => chunk.text.toLowerCase().includes(needle));
  }, [searchTerm, transcriptQuery.data?.chunks]);

  const summaryData = summaryMutation.data?.summary ?? '';
  const quizData = quizMutation.data?.quiz ?? '';
  const notesData = notesMutation.data?.notes ?? '';
  const studyData = studyMutation.data?.study_mode ?? '';
  const flashcards: Flashcard[] = flashcardsMutation.data?.items ?? deriveFlashcards(quizFormat === 'flashcards' ? quizData : notesData || summaryData);

  async function submitQuestion(prompt = draft) {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setDraft('');
    setLiveAnswer('');

    const payload = {
      question: trimmed,
      video_id: videoId,
      stream: true,
      history: nextMessages.map((message) => ({ role: message.role, content: message.content })),
    };

    await streamChatResponse(`${api.defaults.baseURL}/chat`, payload, {
      onToken(token) {
        setLiveAnswer((current) => current + token);
      },
      onFinal(event) {
        setMessages((current) => [...current, { role: 'assistant', content: event.answer }]);
        setLiveAnswer('');
        void queryClient.invalidateQueries({ queryKey: ['history'] });
      },
    });
  }

  if (transcriptQuery.isLoading) {
    return <div className="space-y-4"><div className="h-10 w-72 animate-pulse rounded-2xl bg-muted" /><div className="h-[70vh] animate-pulse rounded-3xl bg-muted" /></div>;
  }

  if (!transcriptQuery.data) {
    return <Card><CardContent className="py-12 text-sm text-muted-foreground">This video has not been processed yet. Return to Home and paste the YouTube URL.</CardContent></Card>;
  }

  const { video, transcript_text } = transcriptQuery.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div>
              <Badge className="mb-2">Video workspace</Badge>
              <CardTitle className="text-2xl">{video.title}</CardTitle>
              <CardDescription className="mt-2">{video.channel} · {Math.round(video.duration / 60)} min</CardDescription>
            </div>
            <a href={video.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-border bg-background p-3 transition hover:shadow-glow">
              <ExternalLink className="h-5 w-5" />
            </a>
          </CardHeader>
          <CardContent>
            <img src={video.thumbnail} alt={video.title} className="aspect-video w-full rounded-[1.75rem] object-cover" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>AI learning tools</CardTitle>
              <CardDescription>Summaries, quizzes, flashcards, and notes generated from the transcript.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(['quick', 'detailed', 'bullet', 'takeaways', 'exam', 'interview'] as const).map((mode) => (
                <Button key={mode} variant={summaryMode === mode ? 'default' : 'outline'} size="sm" onClick={() => setSummaryMode(mode)}>
                  {mode}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(['mcq', 'short', 'flashcards', 'true_false', 'coding', 'interview'] as const).map((format) => (
                <Button key={format} variant={quizFormat === format ? 'accent' : 'outline'} size="sm" onClick={() => setQuizFormat(format)}>
                  {format}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                <Button key={difficulty} variant={quizDifficulty === difficulty ? 'default' : 'outline'} size="sm" onClick={() => setQuizDifficulty(difficulty)}>
                  {difficulty}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button onClick={() => summaryMutation.mutate({ video_id: videoId, mode: summaryMode })}><Sparkles className="mr-2 h-4 w-4" /> Summary</Button>
              <Button variant="outline" onClick={() => quizMutation.mutate({ video_id: videoId, difficulty: quizDifficulty, count: 6, format: quizFormat })}><Wand2 className="mr-2 h-4 w-4" /> Quiz</Button>
              <Button variant="outline" onClick={() => notesMutation.mutate({ video_id: videoId, style: 'markdown' })}>Notes</Button>
              <Button variant="outline" onClick={() => flashcardsMutation.mutate(8)}>Flashcards</Button>
              <Button variant="outline" onClick={() => studyMutation.mutate(videoId)}>Study mode</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="study">Study Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-5">
          <Card className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <CardContent className="space-y-4 pt-6">
              <div className="flex gap-2">
                <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a study question" />
                <Button onClick={() => void submitQuestion(question)}><Send className="mr-2 h-4 w-4" /> Ask</Button>
              </div>
              <div className="space-y-2">
                {(summaryData || quizData || notesData) ? null : <p className="text-sm text-muted-foreground">Suggested follow-ups will appear after the first answer.</p>}
                <div className="flex flex-wrap gap-2">
                  {['What are the key concepts?', 'Which timestamp explains the core idea?', 'Can you compare this to the previous section?'].map((suggestion) => (
                    <Button key={suggestion} variant="outline" size="sm" onClick={() => setDraft(suggestion)}>{suggestion}</Button>
                  ))}
                </div>
              </div>
              <div className="space-y-4 rounded-[1.75rem] border border-border bg-background/50 p-4">
                {messages.map((message, index) => (
                  <div key={index} className={message.role === 'user' ? 'ml-auto max-w-[88%] rounded-3xl bg-primary p-4 text-primary-foreground' : 'max-w-[88%] rounded-3xl bg-muted p-4'}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>
                ))}
                {liveAnswer ? <div className="max-w-[88%] rounded-3xl bg-muted p-4"><ReactMarkdown remarkPlugins={[remarkGfm]}>{liveAnswer}</ReactMarkdown></div> : null}
                <div ref={chatBottom} />
              </div>
            </CardContent>

            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Transcript references</div>
                  <div className="text-xs text-muted-foreground">Source citations and snippets</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(liveAnswer || messages.at(-1)?.content || '')}><Copy className="mr-2 h-4 w-4" /> Copy</Button>
              </div>
              <div className="space-y-3">
                {transcriptQuery.data.chunks.slice(0, 8).map((chunk) => (
                  <button key={chunk.chunk_id} type="button" className="w-full rounded-2xl border border-border bg-background/60 p-3 text-left transition hover:shadow-glow" onClick={() => window.open(youtubeUrl(videoId, chunk.start_time), '_blank', 'noreferrer')}>
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatTimestamp(chunk.start_time)}</span>
                      <span>{chunk.duration.toFixed(1)}s</span>
                    </div>
                    <p className="line-clamp-3 text-sm">{chunk.text}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcript" className="mt-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Transcript</CardTitle>
                <CardDescription>Search, highlight, and jump to exact timestamps.</CardDescription>
              </div>
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search within transcript" className="max-w-md" />
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredChunks.map((chunk) => (
                <button key={chunk.chunk_id} type="button" className="w-full rounded-2xl border border-border bg-background/70 p-4 text-left transition hover:shadow-glow" onClick={() => window.open(youtubeUrl(videoId, chunk.start_time), '_blank', 'noreferrer')}>
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatTimestamp(chunk.start_time)}</span>
                    <span>Open in YouTube</span>
                  </div>
                  <p className="text-sm leading-6">{chunk.text}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-5">
          <Card>
            <CardHeader><CardTitle>Summary</CardTitle><CardDescription>Quick study extraction with timestamps and key points.</CardDescription></CardHeader>
            <CardContent>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryData || 'Generate a summary to start.'}</ReactMarkdown>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz" className="mt-5">
          <Card>
            <CardHeader><CardTitle>Quiz</CardTitle><CardDescription>Practice with questions tailored to the transcript.</CardDescription></CardHeader>
            <CardContent>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{quizData || 'Generate a quiz to start.'}</ReactMarkdown>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flashcards" className="mt-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {flashcards.map((card) => (
              <div key={card.front} className="group h-48 rounded-[1.75rem] border border-border bg-background/60 p-5 perspective-1000">
                <div className="relative h-full rounded-[1.5rem] transition-transform duration-500 group-hover:[transform:rotateY(180deg)] [transform-style:preserve-3d]">
                  <div className="absolute inset-0 flex items-center justify-center rounded-[1.5rem] bg-card p-5 text-center [backface-visibility:hidden]">
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">Front</div>
                      <div className="font-display text-lg font-semibold">{card.front}</div>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center rounded-[1.5rem] bg-primary p-5 text-center text-primary-foreground [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.3em] text-primary-foreground/70">Back</div>
                      <div>{card.back}</div>
                      {card.hint ? <div className="mt-3 text-xs text-primary-foreground/70">{card.hint}</div> : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Markdown notes</CardTitle>
                <CardDescription>Copyable, export-friendly notes for revision.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{notesData || 'Generate notes to start.'}</ReactMarkdown>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="study" className="mt-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Study mode</CardTitle>
                <CardDescription>Roadmap, checklist, revision notes, and a conceptual mind map outline.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{studyData || 'Generate study mode to start.'}</ReactMarkdown>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
