import { useQuery } from '@tanstack/react-query';
import { getCollections, getHistory, getStats, getVideos } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="font-display text-4xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const stats = useQuery({ queryKey: ['stats'], queryFn: getStats });
  const videos = useQuery({ queryKey: ['videos'], queryFn: getVideos });
  const history = useQuery({ queryKey: ['history'], queryFn: getHistory });
  const collections = useQuery({ queryKey: ['collections'], queryFn: getCollections });

  return (
    <div className="space-y-8">
      <div>
        <Badge className="mb-3">Learning dashboard</Badge>
        <h2 className="font-display text-3xl font-bold">Track study momentum across videos.</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">A single view for processed videos, questions asked, study time, bookmarks, and collections.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.data ? (
          <>
            <StatCard label="Videos processed" value={stats.data.videos_processed} />
            <StatCard label="Questions asked" value={stats.data.questions_asked} />
            <StatCard label="Study hours" value={stats.data.study_hours} />
            <StatCard label="Quiz score" value={`${stats.data.quiz_score}%`} />
            <StatCard label="Collections" value={stats.data.collections} />
            <StatCard label="Bookmarks" value={stats.data.bookmarks} />
          </>
        ) : (
          Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-3xl" />)
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent videos</CardTitle>
              <CardDescription>Latest transcripts ready for review.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {videos.data?.length ? videos.data.slice(0, 5).map((video) => (
              <div key={video.video_id} className="flex items-center gap-3 rounded-2xl border border-border bg-background/60 p-3">
                <img src={video.thumbnail} alt={video.title} className="h-14 w-24 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{video.title}</div>
                  <div className="truncate text-sm text-muted-foreground">{video.channel}</div>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No videos processed yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>History and collections</CardTitle>
              <CardDescription>Conversations and curated study sets.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="mb-2 text-sm font-semibold">Conversation history</div>
              <div className="text-sm text-muted-foreground">{history.data?.length ?? 0} saved questions and answers.</div>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="mb-2 text-sm font-semibold">Collections</div>
              <div className="text-sm text-muted-foreground">{collections.data?.length ?? 0} curated learning playlists.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
