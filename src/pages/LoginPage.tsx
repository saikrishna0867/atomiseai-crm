import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, enterPreviewMode } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { document.title = 'Sign In | Atomise AI CRM'; }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast({ title: 'Account created!', description: 'Check your email to verify.' });
      } else {
        await signIn(email, password);
        toast({ title: 'Welcome back! 👋', description: 'Signed in successfully.' });
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewMode = () => {
    enterPreviewMode();
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #07091e 0%, #0d0f2b 50%, #10133a 100%)' }}
      >
        {/* Floating gold orbs */}
        <div className="absolute w-[300px] h-[300px] rounded-full top-[10%] left-[10%]" style={{ background: 'rgba(201,169,110,0.10)', filter: 'blur(80px)', animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute w-[200px] h-[200px] rounded-full bottom-[15%] right-[15%]" style={{ background: 'rgba(201,169,110,0.06)', filter: 'blur(60px)', animation: 'float 6s ease-in-out infinite reverse' }} />

        <div className="relative z-10 text-center space-y-6 px-8">
          <img src="/atomise-logo.png" alt="Atomise AI" className="mx-auto object-contain" style={{ width: 140, height: 140, borderRadius: 12 }} />
          <h1 className="font-display text-4xl font-bold text-white">ATOMISE AI</h1>
          <p className="text-xl font-display" style={{ color: '#d4b483' }}>Automating Tomorrow, Today</p>
          <div className="space-y-3 mt-8">
            {[
              '6 Live Automation Workflows',
              'GPT-4o AI Lead Intelligence',
              'Real-Time Pipeline Management',
              'Automated Drip Email Sequences',
            ].map(f => (
              <div key={f} className="flex items-center gap-3 justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c9a96e] shrink-0" />
                <p className="text-sm text-white/75">{f}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center bg-background p-4 md:p-6">
        <div className="w-full max-w-[420px]">
          <div
            className="rounded-3xl p-10 space-y-6"
            style={{
              background: 'rgba(10,12,34,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(201,169,110,0.20)',
            }}
          >
            {/* Logo */}
            <div className="flex items-center justify-center mb-2">
              <img src="/atomise-logo.png" alt="Atomise AI" className="w-12 h-12 object-contain" />
            </div>

            <div className="text-center">
              <h2 className="font-display text-[28px] font-bold text-foreground">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1">Sign in to your CRM dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="glass-input w-full" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="glass-input w-full" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-display text-[16px] font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
                style={{
                  background: '#c9a96e',
                  color: '#07091e',
                  boxShadow: '0 4px 20px rgba(201,169,110,0.40)',
                }}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>

            <div className="rounded-[10px] p-3" style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.15)' }}>
              <p className="text-xs text-muted-foreground text-center">🔑 Demo: <span className="text-foreground font-medium">admin@automise.ai</span> / <span className="text-foreground font-medium">atomise2026</span></p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-[rgba(201,169,110,0.20)] text-muted-foreground hover:text-foreground rounded-xl"
              onClick={handlePreviewMode}
            >
              Skip Login (Preview Mode)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
