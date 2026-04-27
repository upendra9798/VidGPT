import { useTheme } from '@/contexts/theme-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-8">
      <div>
        <Badge className="mb-3">Settings</Badge>
        <h2 className="font-display text-3xl font-bold">Polish the workspace for long study sessions.</h2>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Switch between light and dark glassmorphism modes.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={toggleTheme}>{theme === 'dark' ? 'Switch to light' : 'Switch to dark'}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Environment</CardTitle>
            <CardDescription>Configure API keys and local services in .env before running.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• GROQ_API_KEY for LLM responses</p>
          <p>• CHROMA_PATH for vector storage</p>
          <p>• DATA_DIR for transcripts and SQLite</p>
          <p>• VITE_API_BASE_URL for frontend API routing</p>
        </CardContent>
      </Card>
    </div>
  );
}
