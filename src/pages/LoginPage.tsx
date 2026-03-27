import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { document.title = 'Sign In | Atomise CRM'; }, []);

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
    <div className="min-h-screen flex">
      {/* Left Panel — Animated Background */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a0014 0%, #1a0040 30%, #0d0030 60%, #06001a 100%)' }}
      >
        {/* Floating orbs */}
        <div className="absolute w-[300px] h-[300px] rounded-full top-[10%] left-[20%] opacity-100" style={{ background: 'rgba(124,58,237,0.3)', filter: 'blur(80px)', animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute w-[200px] h-[200px] rounded-full bottom-[20%] right-[20%] opacity-100" style={{ background: 'rgba(34,211,238,0.15)', filter: 'blur(60px)', animation: 'float 6s ease-in-out infinite reverse' }} />
        <div className="absolute w-[150px] h-[150px] rounded-full top-[50%] left-[50%] opacity-100" style={{ background: 'rgba(167,139,250,0.2)', filter: 'blur(40px)', animation: 'float 10s ease-in-out infinite 2s' }} />

        <div className="relative z-10 text-center space-y-6 px-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-muted flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.5)]">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold text-white">Atomise <span className="text-purple-bright">CRM</span></h1>
          <p className="text-xl text-white/60 font-display">Automating Tomorrow, Today</p>
          <div className="space-y-3 mt-8">
            {['⚡ 6 Live Automations', '🤖 AI-Powered Insights', '📊 Real-Time Pipeline'].map(f => (
              <p key={f} className="text-sm text-white/40">{f}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-[400px]">
          <div
            className="rounded-3xl p-10 space-y-6"
            style={{
              background: 'rgba(14,14,22,0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(124,58,237,0.25)',
            }}
          >
            {/* Logo */}
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-muted flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.3)]">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">Atomise <span className="text-purple-bright">CRM</span></span>
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
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-[#4c1d95] text-white font-display text-[16px] font-semibold shadow-[0_4px_20px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.5)] transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
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

            <div className="rounded-[10px] p-3" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <p className="text-xs text-muted-foreground">🔑 Demo: <span className="text-foreground font-medium">admin@atomise.ai</span> / <span className="text-foreground font-medium">atomise2026</span></p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-[rgba(124,58,237,0.2)] text-muted-foreground hover:text-foreground rounded-xl"
              onClick={() => navigate('/dashboard')}
            >
              Skip Login (Preview Mode)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
