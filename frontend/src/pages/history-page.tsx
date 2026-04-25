import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock3, RotateCcw } from 'lucide-react';
import { getHistory } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function HistoryPage() {
  const navigate = useNavigate();
  const history = useQuery({ queryKey: ['history'], queryFn: getHistory });

  return (
    <div className="space-y-8">
      <div>
        <Badge className="mb-3">History</Badge>
        <h2 className="font-display text-3xl font-bold">Reopen previous conversations.</h2>
        <p className="mt-2 text-muted-foreground">Every question, answer, and study session stays available for review.</p>
      </div>

      <div className="grid gap-4">
        {history.data?.length ? history.data.map((item) => (
          <Card key={item.conversation_id}>
            <CardHeader>
              <div>
                <CardTitle className="text-base">{item.question}</CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2"><Clock3 className="h-3 w-3" /> {new Date(item.created_at).toLocaleString()}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => item.video_id && navigate(`/video/${item.video_id}`)} disabled={!item.video_id}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reopen
              </Button>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3 text-sm text-muted-foreground">{item.answer}</p>
            </CardContent>
          </Card>
        )) : <Card><CardContent className="py-10 text-sm text-muted-foreground">No history yet. Ask a question from a video workspace.</CardContent></Card>}
      </div>
    </div>
  );
}
