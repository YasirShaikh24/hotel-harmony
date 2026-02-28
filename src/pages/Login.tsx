import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // quick offline guard
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      toast({
        title: 'No Internet Connection',
        description: 'Please connect to the internet and try again.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      // if we normalized the message in the context, show that directly
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({
      title: 'Welcome back!',
      description: 'Login successful. Redirecting to dashboard...',
    });

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRoLTEydjJoMTJ2LTJ6bS0xMi0yaDEydi0ySDI0djJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-4 mb-8">
            <img
              src="/hk.png"
              alt="Hotel Krishna Logo"
              className="w-20 h-20 rounded-full object-cover shadow-gold border-2 border-accent"
            />
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground">Hotel Krishna</h1>
              <p className="text-primary-foreground/70">Management System</p>
            </div>
          </div>
          
          <h2 className="text-4xl xl:text-5xl font-bold text-primary-foreground leading-tight mb-6">
            Streamline Your<br />
            <span className="text-gradient-gold">Hotel Operations</span>
          </h2>
          
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Manage rooms, bookings, billing, and more with our comprehensive hotel management solution.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">500+</div>
              <div className="text-sm text-primary-foreground/70">Rooms Managed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">10K+</div>
              <div className="text-sm text-primary-foreground/70">Happy Guests</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">99%</div>
              <div className="text-sm text-primary-foreground/70">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <img
              src="/hk.png"
              alt="Hotel Krishna Logo"
              className="w-14 h-14 rounded-full object-cover shadow-lg"
            />
            <span className="text-2xl font-bold text-foreground">Hotel Krishna</span>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Sign in to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 bg-gradient-primary hover:opacity-90" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}