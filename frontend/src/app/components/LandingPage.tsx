import { ArrowRight, CheckCircle, Users, Briefcase, BarChart3, Shield } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface LandingPageProps {
  onLoginClick: () => void;
  onGetStartedClick: () => void;
}

export function LandingPage({ onLoginClick, onGetStartedClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-blue-50/30 to-background dark:from-background dark:via-blue-950/10 dark:to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 dark:bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-foreground">BenchAstra</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={onLoginClick}
              className="px-6 py-2.5 bg-primary v hover:bg-primary-hover text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/25"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Side - Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary">
              <CheckCircle size={16} />
              <span>Trusted by 500+ Companies</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Streamline Hiring with{' '}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Unified Portals
              </span>
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              Empower clients to manage job postings effortlessly while enabling vendors to submit and track candidates—all in one centralized platform built for efficiency and collaboration.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                </div>
                <p className="text-foreground">
                  <strong>For Clients:</strong> Post requirements, review candidates, and hire faster with AI-powered matching
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                </div>
                <p className="text-foreground">
                  <strong>For Vendors:</strong> Submit qualified profiles, track submissions, and manage placements seamlessly
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                </div>
                <p className="text-foreground">
                  <strong>Centralized Communication:</strong> Real-time updates, automated workflows, and complete transparency
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={onGetStartedClick}
                className="px-8 cursor-pointer py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all duration-200 shadow-xl shadow-blue-600/30 flex items-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight size={20} />
              </button>
              <button
                onClick={onLoginClick}
                className="px-8 cursor-pointer py-4 bg-secondary hover:bg-accent text-foreground font-semibold rounded-xl transition-all duration-200 border border-border"
              >
                Sign In
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-8 pt-8 border-t border-border">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground">Active Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">10K+</div>
                <div className="text-sm text-muted-foreground">Placements</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">98%</div>
                <div className="text-sm text-muted-foreground">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Right Side - Dashboard Mockup */}
          <div className="relative">
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"></div>

            {/* Dashboard Card */}
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Mock Dashboard Header */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Briefcase size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Active Requirements</div>
                    <div className="text-xs text-muted-foreground">12 open positions</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="p-6 space-y-4">
                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={16} className="text-primary" />
                      <span className="text-xs font-medium text-muted-foreground">Candidates</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">248</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 size={16} className="text-green-600" />
                      <span className="text-xs font-medium text-muted-foreground">Matches</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">92%</div>
                  </div>
                </div>

                {/* Mock Job List */}
                <div className="space-y-3">
                  {[
                    { role: 'Senior DevOps Engineer', matches: 12, status: 'Active' },
                    { role: 'Full Stack Developer', matches: 8, status: 'Active' },
                    { role: 'Product Manager', matches: 15, status: 'Active' },
                  ].map((job, idx) => (
                    <div
                      key={idx}
                      className="bg-secondary/50 rounded-lg p-4 flex items-center justify-between hover:bg-secondary transition-colors"
                    >
                      <div>
                        <div className="text-sm font-semibold text-foreground">{job.role}</div>
                        <div className="text-xs text-muted-foreground">{job.matches} matching candidates</div>
                      </div>
                      <div className="px-3 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                        {job.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-border">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">Everything You Need to Scale Hiring</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for modern recruitment workflows
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30">
              <Briefcase size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Client Portal</h3>
            <p className="text-muted-foreground leading-relaxed">
              Post job requirements, review AI-matched candidates, and manage the entire hiring pipeline from one dashboard
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-600/30">
              <Users size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Vendor Portal</h3>
            <p className="text-muted-foreground leading-relaxed">
              Submit qualified candidates, track submissions in real-time, and manage placements with complete transparency
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-600/30">
              <BarChart3 size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">AI-Powered Matching</h3>
            <p className="text-muted-foreground leading-relaxed">
              Intelligent algorithms match candidates to requirements based on skills, experience, and availability
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-600/30">
              <Shield size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Secure & Compliant</h3>
            <p className="text-muted-foreground leading-relaxed">
              Enterprise-grade security with role-based access control, data encryption, and compliance certifications
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-600/30">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Real-Time Updates</h3>
            <p className="text-muted-foreground leading-relaxed">
              Instant notifications and status updates keep all stakeholders informed throughout the hiring process
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-600/30">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                <path d="M9 19V6L20 12L9 19Z" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Analytics & Reports</h3>
            <p className="text-muted-foreground leading-relaxed">
              Comprehensive insights into hiring metrics, vendor performance, and recruitment efficiency
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-primary via-blue-600 to-blue-700 dark:from-blue-900 dark:via-blue-800 dark:to-blue-900 rounded-3xl p-12 lg:p-16 text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>

          <div className="relative z-10">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join hundreds of companies already using BenchAstra to streamline their recruitment process
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={onGetStartedClick}
                className="px-10 cursor-pointer py-4 bg-white text-primary hover:bg-gray-100 font-semibold rounded-xl transition-all duration-200 shadow-2xl flex items-center gap-2"
              >
                <span>Start Free Trial</span>
                <ArrowRight size={20} />
              </button>
              <button
                onClick={onLoginClick}
                className="px-10 cursor-pointer py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20"
              >
                Sign In Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                    <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-foreground">BenchAstra</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-sm">
                The modern recruitment platform connecting clients and vendors for seamless hiring.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; 2026 BenchAstra. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
