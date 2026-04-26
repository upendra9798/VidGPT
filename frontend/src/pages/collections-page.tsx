import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Layers3, Plus } from 'lucide-react';
import { createCollection, getCollections } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function CollectionsPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [videoIds, setVideoIds] = useState('');
  const queryClient = useQueryClient();
  const collections = useQuery({ queryKey: ['collections'], queryFn: getCollections });

  const createMutation = useMutation({
    mutationFn: createCollection,
    onSuccess: async () => {
      setName('');
      setDescription('');
      setVideoIds('');
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <Badge className="mb-3">Collections</Badge>
        <h2 className="font-display text-3xl font-bold">Build multi-video study sets.</h2>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Create collection</CardTitle>
            <CardDescription>Separate video IDs by commas and ask questions across the whole set.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Collection name" />
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" />
          <Textarea value={videoIds} onChange={(event) => setVideoIds(event.target.value)} placeholder="Video IDs, comma-separated" />
          <div className="md:col-span-3">
            <Button onClick={() => createMutation.mutate({ name, description, video_ids: videoIds.split(',').map((item) => item.trim()).filter(Boolean) })} disabled={!name || createMutation.isPending}>
              <Plus className="mr-2 h-4 w-4" /> Create collection
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {collections.data?.length ? collections.data.map((collection) => (
          <Card key={collection.id}>
            <CardHeader>
              <div>
                <CardTitle>{collection.name}</CardTitle>
                <CardDescription>{collection.description || 'No description provided.'}</CardDescription>
              </div>
              <Layers3 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{collection.video_ids.length} videos in this study set.</p>
            </CardContent>
          </Card>
        )) : <Card><CardContent className="py-10 text-sm text-muted-foreground">No collections yet.</CardContent></Card>}
      </div>
    </div>
  );
}
