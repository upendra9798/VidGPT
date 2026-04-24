import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { searchTranscript } from '@/services/api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const search = useQuery({ queryKey: ['search', debouncedQuery], queryFn: () => searchTranscript(debouncedQuery), enabled: debouncedQuery.length > 2 });

  return (
    <div className="space-y-8">
      <div>
        <Badge className="mb-3">Semantic search</Badge>
        <h2 className="font-display text-3xl font-bold">Search transcript meaning, not just keywords.</h2>
      </div>

      <Card>
        <CardContent className="flex gap-3 pt-6">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Search "Explain vector database"' />
          <Button variant="outline"><SearchIcon className="mr-2 h-4 w-4" /> Search</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {search.data?.results?.length ? search.data.results.map((hit) => (
          <Card key={hit.chunk_id}>
            <CardHeader>
              <div>
                <CardTitle className="text-base">{hit.title}</CardTitle>
                <CardDescription>{hit.timestamp.toFixed(2)}s · similarity {(hit.score * 100).toFixed(1)}%</CardDescription>
              </div>
              <Sparkles className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{hit.text}</p>
            </CardContent>
          </Card>
        )) : <Card><CardContent className="py-10 text-sm text-muted-foreground">Enter a query to search across transcript chunks.</CardContent></Card>}
      </div>
    </div>
  );
}
