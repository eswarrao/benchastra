import { useState, useEffect } from 'react';
import React from 'react';
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import Carousel1 from "../../assets/Carousel 1.jpeg";
import Carousel2 from "../../assets/Carousel 2.jpeg";
import Carousel3 from "../../assets/Carousel 3.jpeg";
import LogoLight from '../../assets/Logo 3.jpeg';
import LogoDark from '../../assets/Logo 4.png';
import { apiPost } from '@/config/api';
import { apiGet } from '@/config/api';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; role?: string }>;
  onForgotPassword: () => void;
  onSignup: () => void;
  onBackToHome?: () => void;
}

// 3 dummy images for carousel
const CAROUSEL_IMAGES = [
  Carousel1,
  Carousel2,
  Carousel3,
];

// Constant text - same for all carousel images
const BRAND_NAME = "BenchAstra";

export function LoginPage({ onLogin, onForgotPassword, onSignup, onBackToHome }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use apiPost instead of the onLogin prop
      const data = await apiPost('/auth/login', { email, password });

      // Store tokens
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);

      if (data.role) {
        localStorage.setItem('user_role', data.role);
        sessionStorage.setItem('userRole', data.role);
        sessionStorage.setItem('user', JSON.stringify({ email, role: data.role }));
      }

      // Get user info
      try {
        const userData = await apiGet('/users/me');
        localStorage.setItem('user_email', userData.email);
      } catch (err) {
        console.error('Failed to get user info:', err);
      }

      // Call the onLogin prop to update app state
      await onLogin(email, password);

    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? CAROUSEL_IMAGES.length - 1 : prev - 1));
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Carousel with Constant Text */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        {/* Background Image Carousel */}
        <div className="absolute inset-0">
          {CAROUSEL_IMAGES.map((img, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
            >
              <img
                src={img}
                alt={`Carousel ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600/1a4fa3/ffffff?text=BenchAstra';
                }}
              />
              <div className="absolute inset-0 bg-black/50"></div>
            </div>
          ))}
        </div>

        {/* Content overlay - Constant Text */}
        <div className="relative z-10 text-left px-16 max-w-2xl ml-12">
          {/* Brand Name */}
          {/* Brand Name with Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-white/20 flex-shrink-0">
              {/* Light mode logo */}
              <img
                src={LogoLight}
                alt="BenchAstra"
                className="w-full h-full object-cover dark:hidden"
              />
              {/* Dark mode logo */}
              <img
                src={LogoDark}
                alt="BenchAstra"
                className="w-full h-full object-cover hidden dark:block"
              />
            </div>
            <h2 className="text-4xl font-bold text-white tracking-wide">
              {BRAND_NAME}
            </h2>
          </div>

          {/* Tagline - Multi-line with elegant styling */}
          <div className="mb-4">
            <p className="text-4xl font-bold text-white leading-snug">
              Bridging the gap between <span className="text-emerald-400">talent</span> and demand.
            </p>
          </div>

          {/* Subtext */}
          <div className="mt-6">
            <p className="text-white/70 text-lg max-w-2xl leading-relaxed">
              The premium ecosystem for vendor bench management and seamless client engagements.
            </p>
          </div>

          {/* Carousel Navigation Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {CAROUSEL_IMAGES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`transition-all duration-300 cursor-pointer rounded-full ${idx === currentImageIndex
                  ? 'w-8 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                  }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          {/* <button
            onClick={goToPreviousImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all cursor-pointer"
            aria-label="Previous image"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <button
            onClick={goToNextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all cursor-pointer"
            aria-label="Next image"
          >
            <ArrowRight size={20} className="text-white" />
          </button> */}
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-white dark:bg-slate-900 relative overflow-y-auto">
        {/* Header with Back Button, Logo, and Theme Toggle */}
        <div className="absolute top-6 left-6 right-6 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBackToHome && (
                <button
                  onClick={onBackToHome}
                  className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm transition-all duration-200 group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back to Home</span>
                </button>
              )}


            </div>

            <ThemeToggle />
          </div>
        </div>

        <div className="min-h-screen flex flex-col items-center justify-center py-12 px-6">
          {/* Login Card */}
          <div className="w-full max-w-md mt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Sign in to your account
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Password Field with Visibility Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder:text-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        localStorage.setItem('remembered_email', email);
                      } else {
                        localStorage.removeItem('remembered_email');
                      }
                    }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm cursor-pointer font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSignup}
                  className="font-medium cursor-pointer text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Sign up
                </button>
              </p>
            </div>

            {/* Terms & Privacy */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
              By continuing, you agree to BenchAstra's Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}