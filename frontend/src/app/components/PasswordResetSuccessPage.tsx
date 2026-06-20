import { ArrowRight, CheckCircle } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import imgBg from 'figma:asset/d55c043b01555d928cb9cb8230fa722c39d2b527.png';

interface PasswordResetSuccessPageProps {
  onBackToLogin: () => void;
}

export function PasswordResetSuccessPage({ onBackToLogin }: PasswordResetSuccessPageProps) {
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

        {/* Success Card */}
        <div className="bg-card dark:bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-border p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-green-600" />
          </div>

          <h2 className="text-2xl font-semibold text-card-foreground mb-3">Password Reset!</h2>
          <p className="text-muted-foreground mb-8">
            Your password has been successfully reset. You can now login with your new password.
          </p>

          <button
            onClick={onBackToLogin}
            className="w-full h-11 cursor-pointer bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
          >
            <span>Back to Login</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
