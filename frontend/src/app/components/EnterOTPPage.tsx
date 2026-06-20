import { useState, useRef, KeyboardEvent } from 'react';
import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import imgBg from 'figma:asset/d55c043b01555d928cb9cb8230fa722c39d2b527.png';

interface EnterOTPPageProps {
  email: string;
  onBackToLogin: () => void;
  onVerifyCode: (code: string) => void;
  onResendCode: () => void;
}

export function EnterOTPPage({ email, onBackToLogin, onVerifyCode, onResendCode }: EnterOTPPageProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return;
    // Save for use in ResetPasswordPage — actual verification happens there
    localStorage.setItem('reset_email', email);
    localStorage.setItem('reset_otp', code);
    onVerifyCode(code);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-blue-600 to-blue-800 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

      {/* Animated floating elements */}
      <div className="absolute top-20 right-20 w-40 h-40 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 rotate-12 animate-rotate-slow-cw"></div>
      <div className="absolute bottom-32 left-16 w-32 h-32 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 -rotate-6 animate-rotate-slow-ccw"></div>

      {/* Theme toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle variant="auth" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-lg rounded-xl flex items-center justify-center border border-white/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-white">BenchAstra</span>
        </div>

        {/* Form Card */}
        <div className="bg-card dark:bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-border p-8">
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:text-primary/80 transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </button>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-card-foreground mb-2">Enter OTP</h2>
            <p className="text-muted-foreground mb-1">We've sent a 6-digit code to</p>
            <p className="text-primary font-medium">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-3">
                Verification Code
              </label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-semibold bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-primary cursor-pointer hover:bg-primary-hover text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
            >
              <span>Verify Code</span>
              <ArrowRight size={18} />
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={onResendCode}
                className="text-sm cursor-pointer text-muted-foreground hover:text-primary transition-colors"
              >
                Resend Code
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
