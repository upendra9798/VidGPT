import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Bot, BrainCircuit, Sparkles, TimerReset, Wand2, PlayCircle, ShieldCheck, LibraryBig } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { processVideo, getVideos } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const features = [
  { icon: Bot, title: 'RAG chat', description: 'Ask questions and get timestamped answers grounded in the transcript.' },
  { icon: TimerReset, title: 'Smart summaries', description: 'Quick, detailed, bullet, exam, and interview-ready summaries.' },
  { icon: LibraryBig, title: 'Collections', description: 'Group related videos into playlists and search across them together.' },
  { icon: BrainCircuit, title: 'Study mode', description: 'Generate roadmaps, revision notes, quizzes, and flashcards.' },
  { icon: ShieldCheck, title: 'Reliable storage', description: 'Store transcripts, embeddings, and histories for reopening later.' },
  { icon: Wand2, title: 'Multi-video search', description: 'Find concepts across multiple videos with semantic retrieval.' },
];

export function HomePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');

  const videosQuery = useQuery({ queryKey: ['videos'], queryFn: getVideos });

  const processMutation = useMutation({
    mutationFn: processVideo,
    onSuccess: (data) => navigate(`/video/${data.video.video_id}`),
  });

  const recentVideos = useMemo(() => videosQuery.data?.slice(0, 3) ?? [], [videosQuery.data]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-mesh-light dark:bg-mesh-dark" />
      <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-glow" />
      <div className="absolute right-[-6rem] top-32 h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-float" />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <PlayCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-lg font-bold">YoutuLearn AI</p>
            <p className="text-xs text-muted-foreground">Learn Anything from YouTube with AI.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge>React 19</Badge>
          <Badge>FastAPI RAG</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="mb-5 bg-primary/10 text-primary">AI learning workspace</Badge>
            <h1 className="font-display text-5xl font-bold tracking-tight text-balance sm:text-6xl">
              Turn YouTube into a serious study system.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
              Paste any YouTube link, build a transcript-backed knowledge base, chat with citations, generate notes and quizzes, and continue every conversation later.
            </p>

            <div className="mt-8 rounded-[2rem] border border-border bg-card/80 p-4 shadow-glow backdrop-blur">
              <div className="flex flex-col gap-3 lg:flex-row">
                <Input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="Paste a YouTube URL"
                  className="flex-1 bg-background"
                />
                <Button size="lg" onClick={() => processMutation.mutate(url)} disabled={!url || processMutation.isPending}>
                  {processMutation.isPending ? 'Processing...' : 'Process video'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              {processMutation.isError ? <p className="mt-3 text-sm text-red-500">Unable to process that URL. Check the link and try again.</p> : null}
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="rounded-full border border-border bg-card px-4 py-2">Timestamp citations</span>
              <span className="rounded-full border border-border bg-card px-4 py-2">Streaming chat</span>
              <span className="rounded-full border border-border bg-card px-4 py-2">Flashcards</span>
              <span className="rounded-full border border-border bg-card px-4 py-2">Multi-video RAG</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className={index === 0 ? 'sm:col-span-2' : ''}>
                  <CardHeader>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardDescription>{feature.description}</CardDescription>
                </Card>
              );
            })}
          </motion.div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent videos</CardTitle>
                <CardDescription>Resume previously processed content instantly.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {recentVideos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No videos processed yet. Paste a URL above to start.</p>
                ) : (
                  recentVideos.map((video) => (
                    <motion.button
                      key={video.video_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      onClick={() => navigate(`/video/${video.video_id}`)}
                      className="flex w-full items-center gap-4 rounded-2xl border border-border bg-background/70 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-glow"
                    >
                      <img src={video.thumbnail} alt={video.title} className="h-16 w-28 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{video.title}</div>
                        <div className="truncate text-sm text-muted-foreground">{video.channel}</div>
                      </div>
                    </motion.button>
                  ))
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Why it feels different</CardTitle>
                <CardDescription>Designed like a product, not a demo.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Timestamp-aware answers with source snippets and confidence scoring.</p>
              <p>• Collection-level retrieval for playlists, courses, and interview prep.</p>
              <p>• Markdown notes, flashcards, quizzes, study mode, and export-ready outputs.</p>
              <p>• Glassmorphism interface, responsive layout, and animated empty states.</p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
