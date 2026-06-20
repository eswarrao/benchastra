import { Users, Briefcase, CheckCircle, ArrowRight } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface RoleSelectionPageProps {
  onSelectRole: (role: 'vendor' | 'client') => void;
}

const vendorFeatures = [
  'List your available resources',
  'Receive job requirement matches',
  'Manage placements & contracts',
  'Get AI-powered matches',
];

const clientFeatures = [
  'Post job requirements',
  'Search & filter qualified talent',
  'Manage placements & contracts',
  'Get AI-powered matches',
];

export function RoleSelectionPage({ onSelectRole }: RoleSelectionPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 dark:border-slate-700/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100">BenchAstra</span>
        </div>
        <ThemeToggle />
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10">

        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-3">
            Welcome to BenchAstra!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg">
            Choose how you want to use the platform
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full max-w-4xl">

          {/* ── Vendor Card ── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-7 flex flex-col hover:shadow-xl hover:border-green-400/60 dark:hover:border-green-500/50 transition-all duration-300 group">
            {/* Icon */}
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
              <Users size={28} className="text-green-600 dark:text-green-400" />
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
              I'm a Vendor
            </h2>

            {/* Description */}
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
              Showcase your talented resources, manage availability, and connect with companies looking for skilled professionals.
            </p>

            {/* Feature list */}
            <ul className="space-y-3 mb-8 flex-1">
              {vendorFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle size={17} className="text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              onClick={() => onSelectRole('vendor')}
              className="w-full py-3 cursor-pointer bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 hover:shadow-green-600/30 hover:scale-[1.02]"
            >
              Continue as Vendor
              <ArrowRight size={18} />
            </button>
          </div>

          {/* ── Client Card ── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-7 flex flex-col hover:shadow-xl hover:border-blue-400/60 dark:hover:border-blue-500/50 transition-all duration-300 group">
            {/* Icon */}
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
              <Briefcase size={28} className="text-blue-600 dark:text-blue-400" />
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
              I'm a Client
            </h2>

            {/* Description */}
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
              Post job requirements, discover pre-vetted talent, and build your team with the right professionals quickly.
            </p>

            {/* Feature list */}
            <ul className="space-y-3 mb-8 flex-1">
              {clientFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle size={17} className="text-blue-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              onClick={() => onSelectRole('client')}
              className="w-full py-3 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:scale-[1.02]"
            >
              Continue as Client
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-8 text-center max-w-sm">
          You can switch roles anytime from your account settings
        </p>
      </main>
    </div>
  );
}
