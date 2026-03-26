import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AtomiseLogo } from '@/components/AtomiseLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast({ title: 'Account created!', description: 'Check your email to verify.' });
      } else {
        await signIn(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background gradient-mesh">
      <div className="w-full max-w-md mx-4">
        <div className="glass-card-purple p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <AtomiseLogo />
            </div>
            <p className="text-sm text-muted-foreground">Automating Tomorrow, Today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Demo:</span> admin@atomise.ai / atomise2026
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-border text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/dashboard')}
          >
            Skip Login (Preview Mode)
          </Button>
        </div>
      </div>
    </div>
  );
}
