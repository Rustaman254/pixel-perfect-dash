import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, User, LogIn, Eye, EyeOff, ShoppingCart } from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.fullName) return;
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
            <h2 className="text-2xl font-bold" style={{ color: '#1a1a1a', fontFamily: 'Rebond Grotesque, sans-serif' }}>Create your account</h2>
            <p className="text-sm mt-1" style={{ color: '#999999' }}>Start your 14-day free trial</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-destructive text-sm px-4 py-3 rounded-xl font-medium">{error}</div>}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#555555' }}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5" style={{ color: '#aaaaaa' }} />
                <input type="text" placeholder="Enter your name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all" style={{ backgroundColor: '#f5f7f9', border: '1px solid #e2e8f0' }}
                  onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 2px rgba(124,58,237,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                  required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: '#555555' }}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5" style={{ color: '#aaaaaa' }} />
                <input type="email" placeholder="Enter your email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
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
                <input type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
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
              {loading ? 'Creating account...' : 'Create Account'} <LogIn className="w-5 h-5" />
            </button>
          </form>
          <p className="text-center text-sm mt-6" style={{ color: '#999999' }}>
            Already have an account? <button onClick={() => navigate('/login')} className="font-bold" style={{ color: '#7C3AED' }}>Log in</button>
          </p>
        </div>
      </div>
      <p className="mt-8 text-xs" style={{ color: '#bbbbbb' }}>© 2026 Shopalize Inc. All rights reserved.</p>
    </div>
  );
}
