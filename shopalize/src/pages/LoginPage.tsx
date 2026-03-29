import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, LogIn, Eye, EyeOff, ShoppingCart } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#f5f7f9' }}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <div className="p-8">
          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-10 h-10" style={{ color: '#7C3AED' }} />
              <span className="text-2xl font-bold" style={{ color: '#333333', fontFamily: 'Rebond Grotesque, sans-serif' }}>Shopalize</span>
            </div>
          </div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold" style={{ color: '#1a1a1a', fontFamily: 'Rebond Grotesque, sans-serif' }}>Welcome Back</h2>
            <p className="text-sm mt-1" style={{ color: '#999999' }}>Log in to manage your store.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-destructive text-sm px-4 py-3 rounded-xl font-medium">{error}</div>}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#555555' }}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5" style={{ color: '#aaaaaa' }} />
                <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all" style={{ backgroundColor: '#f5f7f9', border: '1px solid #e2e8f0' }}
                  onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 2px rgba(124,58,237,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#555555' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5" style={{ color: '#aaaaaa' }} />
                <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm outline-none transition-all" style={{ backgroundColor: '#f5f7f9', border: '1px solid #e2e8f0' }}
                  onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 2px rgba(124,58,237,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3" style={{ color: '#aaaaaa' }}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 mt-4 transition-all disabled:opacity-70"
              style={{ backgroundColor: '#7C3AED' }}
              onMouseEnter={e => (e.target as HTMLElement).style.backgroundColor = '#6D28D9'}
              onMouseLeave={e => (e.target as HTMLElement).style.backgroundColor = '#7C3AED'}>
              {loading ? 'Logging in...' : 'Log In'} <LogIn className="w-5 h-5" />
            </button>
          </form>
          <p className="text-center text-sm mt-6" style={{ color: '#999999' }}>
            Don't have an account? <button onClick={() => navigate('/signup')} className="font-bold" style={{ color: '#7C3AED' }}>Sign up</button>
          </p>
        </div>
      </div>
      <p className="mt-8 text-xs" style={{ color: '#bbbbbb' }}>© 2026 Shopalize Inc. All rights reserved.</p>
    </div>
  );
}
