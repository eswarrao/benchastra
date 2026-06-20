import { useState, useCallback, useRef, useEffect, memo } from 'react';
import React from 'react'
import { Users, Briefcase, ArrowRight, Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface RoleBasedLoginPageProps {
  onLogin: (email: string, password: string, role: 'client' | 'vendor') => void;
  onForgotPassword: () => void;
  onSignup: () => void;
  onBackToHome?: () => void;
}

const vendorLoginFeatures = [
  'Manage your bench resources',
  'Track active placements',
  'View AI-matched opportunities',
];

const clientLoginFeatures = [
  'Post & manage job requirements',
  'Browse pre-vetted talent',
  'Track your placements',
];

// Separate the form into its own memoized component to prevent parent re-renders
const LoginForm = memo(({ 
  role, 
  email, 
  password, 
  onEmailChange, 
  onPasswordChange, 
  onSubmit, 
  onForgotPassword, 
  onSignup, 
  onBack,
  error,
  loading
}: { 
  role: 'client' | 'vendor';
  email: string;
  password: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
  onSignup: () => void;
  onBack: () => void;
  error: string;
  loading: boolean;
}) => {
  const isClient = role === 'client';
  const accentIconBg = isClient ? '#3b82f6' : '#22c55e';
  const accentBtn = isClient ? '#2563eb' : '#16a34a';
  const accentHover = isClient ? '#1d4ed8' : '#15803d';
  const accentFocus = isClient ? '#2563eb' : '#16a34a';
  const accentShadow = isClient
    ? '0 4px 14px rgba(37,99,235,0.3)'
    : '0 4px 14px rgba(22,163,74,0.3)';

  // Mobile touch event handling
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="w-full max-w-[420px] flex flex-col gap-3">
      <button
        onClick={onBack}
        className="flex cursor-pointer items-center gap-1.5 text-[12.5px] font-medium w-fit transition-opacity hover:opacity-70 touch-manipulation"
        style={{ color: 'rgba(255,255,255,0.85)' }}
      >
        <ArrowLeft size={15} />
        Back to role selection
      </button>

      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
      >
        <div className="px-4 sm:px-6 pt-6 pb-5">
          <div className="flex flex-col items-center mb-5">
            <div
              className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center mb-3"
              style={{ background: accentIconBg }}
            >
              {isClient ? <Briefcase size={26} color="white" /> : <Users size={26} color="white" />}
            </div>
            <h2
              className="text-[18px] font-bold mb-0.5 text-center"
              style={{ color: '#1e293b', letterSpacing: '-0.3px' }}
            >
              {isClient ? 'Client Login' : 'Vendor Login'}
            </h2>
            <p className="text-[12.5px] text-center" style={{ color: '#64748b' }}>
              Sign in to your {role} account
            </p>
          </div>

          {error && (
            <div
              className="mb-4 px-3 py-2.5 rounded-xl text-[12px] font-medium"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
            <div onTouchStart={handleTouchStart}>
              <label className="block text-[11.5px] font-semibold mb-1" style={{ color: '#475569' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={onEmailChange}
                  placeholder="you@company.com"
                  required
                  enterKeyHint="next"
                  className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] outline-none transition-all mobile:text-[16px]"
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    color: '#1e293b',
                    fontSize: '16px',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = `1.5px solid ${accentFocus}`;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${accentFocus}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = '1.5px solid #e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div onTouchStart={handleTouchStart}>
              <label className="block text-[11.5px] font-semibold mb-1" style={{ color: '#475569' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }} />
                <input
                  type="password"
                  value={password}
                  onChange={onPasswordChange}
                  placeholder="Enter your password"
                  required
                  enterKeyHint="done"
                  className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] outline-none transition-all mobile:text-[16px]"
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    color: '#1e293b',
                    fontSize: '16px',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = `1.5px solid ${accentFocus}`;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${accentFocus}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = '1.5px solid #e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded"
                  style={{ accentColor: accentBtn } as React.CSSProperties}
                />
                <span className="text-[12px] font-medium" style={{ color: '#64748b' }}>
                  Remember me
                </span>
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-[12px] cursor-pointer font-semibold transition-opacity hover:opacity-70 touch-manipulation"
                style={{ color: accentBtn }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer py-3 rounded-xl border-none text-white text-[13.5px] font-bold flex items-center justify-center gap-2 transition-all duration-150 touch-manipulation"
              style={{
                background: accentBtn,
                boxShadow: accentShadow,
                opacity: loading ? 0.75 : 1,
                letterSpacing: '0.1px',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = accentHover;
                  el.style.transform = 'scale(1.015)';
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = accentBtn;
                el.style.transform = 'scale(1)';
              }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Login as {isClient ? 'Client' : 'Vendor'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        <div
          className="px-6 py-3 text-center text-[12px] font-medium"
          style={{
            background: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            color: '#94a3b8',
          }}
        >
          Don't have an account?{' '}
          <button
            onClick={onSignup}
            className="font-bold cursor-pointer transition-opacity hover:opacity-70 touch-manipulation"
            style={{ color: accentBtn }}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
});

LoginForm.displayName = 'LoginForm';

export function RoleBasedLoginPage({
  onLogin,
  onForgotPassword,
  onSignup,
  onBackToHome,
}: RoleBasedLoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<'client' | 'vendor' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const isMobileRef = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    checkMobile();
    
    // Prevent body from scrolling on desktop
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleRoleSelect = useCallback((role: 'client' | 'vendor') => {
    setSelectedRole(role);
    setError('');
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) { 
      setError('Please select your role first'); 
      return; 
    }
    setLoading(true);
    setError('');
    try {
      await onLogin(email, password, selectedRole);
    } catch (err) {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  }, [selectedRole, email, password, onLogin]);

  const handleBackToRoleSelect = useCallback(() => {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setError('');
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const PageShell = useCallback(({ children }: { children: React.ReactNode }) => (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{
        height: '100vh',
        width: '100vw',
        maxWidth: '100%',
        overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: 'linear-gradient(135deg, #1a4fa3 0%, #1e62c4 45%, #1a8fd1 100%)',
      }}
    >
      {/* Dark mode background */}
      <div className="absolute inset-0 dark:bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_50%,#0f172a_100%)] -z-10" />
      
      {/* Decorative elements */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 15% 50%, rgba(255,255,255,0.07) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(255,255,255,0.05) 0%, transparent 50%)',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          width: 180,
          height: 180,
          top: '-40px',
          right: '-40px',
          borderRadius: '28px',
          background: 'rgba(255,255,255,0.08)',
          border: '1.5px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(2px)',
          transform: 'rotate(15deg)',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          width: 110,
          height: 110,
          bottom: '-28px',
          left: '-28px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.06)',
          border: '1.5px solid rgba(255,255,255,0.13)',
          backdropFilter: 'blur(2px)',
          transform: 'rotate(-12deg)',
        }}
      />
      
      {/* Header */}
      <div className="absolute top-0 right-0 z-30 p-4">
        <ThemeToggle />
      </div>
      
      {children}
    </div>
  ), []);

  const LogoPill = useCallback(() => (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl mb-6"
      style={{
        background: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.25)',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
        <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-white font-bold text-[14px] tracking-tight">BenchAstra</span>
    </div>
  ), []);

  // Role selection screen
  if (!selectedRole) {
    return (
      <PageShell>
        <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 w-full max-w-full">
          <div className="flex flex-col items-center gap-3 text-center mb-8">
            <LogoPill />
            <h1
              className="text-[1.75rem] sm:text-[2rem] font-extrabold text-white leading-tight"
              style={{ letterSpacing: '-0.5px' }}
            >
              Welcome Back!
            </h1>
            <p className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.78)' }}>
              First, tell us who you are
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[760px]">
            <RoleCard
              iconBg="#22c55e"
              icon={<Users size={26} color="white" />}
              title="I'm a Vendor"
              description="Showcase your talented resources, manage availability, and connect with companies looking for skilled professionals."
              features={vendorLoginFeatures}
              checkColor="#22c55e"
              btnBg="#16a34a"
              btnHover="#15803d"
              btnLabel="Continue as Vendor"
              onClick={() => handleRoleSelect('vendor')}
            />
            <RoleCard
              iconBg="#3b82f6"
              icon={<Briefcase size={26} color="white" />}
              title="I'm a Client"
              description="Post job requirements, discover pre-vetted talent, and build your team with the right professionals quickly."
              features={clientLoginFeatures}
              checkColor="#3b82f6"
              btnBg="#2563eb"
              btnHover="#1d4ed8"
              btnLabel="Continue as Client"
              onClick={() => handleRoleSelect('client')}
            />
          </div>

          <p className="text-[12px] font-medium mt-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Don't have an account?{' '}
            <button
              onClick={onSignup}
              className="font-bold cursor-pointer underline underline-offset-2 transition-opacity hover:opacity-80 touch-manipulation"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Sign up
            </button>
          </p>
        </div>
      </PageShell>
    );
  }

  // Login form screen
  return (
    <PageShell>
      <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 w-full max-w-full">
        <LogoPill />
        <LoginForm
          role={selectedRole}
          email={email}
          password={password}
          onEmailChange={handleEmailChange}
          onPasswordChange={handlePasswordChange}
          onSubmit={handleSubmit}
          onForgotPassword={onForgotPassword}
          onSignup={onSignup}
          onBack={handleBackToRoleSelect}
          error={error}
          loading={loading}
        />
      </div>
    </PageShell>
  );
}

interface RoleCardProps {
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  checkColor: string;
  btnBg: string;
  btnHover: string;
  btnLabel: string;
  onClick: () => void;
}

function RoleCard({
  iconBg, icon, title, description, features,
  checkColor, btnBg, btnHover, btnLabel, onClick,
}: RoleCardProps) {
  return (
    <div
      className="rounded-2xl flex flex-col overflow-hidden cursor-pointer transition-all duration-250 group"
      style={{
        background: '#ffffff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = 'translateY(-3px)';
        el.style.boxShadow = '0 20px 44px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)';
      }}
    >
      <div className="flex flex-col flex-1 p-5 pb-4">
        <div
          className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105"
          style={{ background: iconBg }}
        >
          {icon}
        </div>

        <h2
          className="text-[19px] font-bold mb-2"
          style={{ color: '#1e293b', letterSpacing: '-0.3px' }}
        >
          {title}
        </h2>

        <p className="text-[12.5px] leading-relaxed mb-4" style={{ color: '#64748b' }}>
          {description}
        </p>

        <ul className="flex flex-col gap-2">
          {features.map((f) => (
            <li
              key={f}
              className="flex items-center gap-2 text-[12.5px] font-medium"
              style={{ color: '#334155' }}
            >
              <CheckCircle size={14} style={{ color: checkColor, flexShrink: 0 }} />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <button
        className="w-full cursor-pointer py-3.5 flex items-center justify-center gap-2 text-white text-[13.5px] font-bold transition-colors duration-150 touch-manipulation"
        style={{ background: btnBg, borderRadius: '0 0 16px 16px', letterSpacing: '0.1px' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = btnHover; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = btnBg; }}
      >
        {btnLabel} <ArrowRight size={16} />
      </button>
    </div>
  );
}