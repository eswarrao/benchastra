// components/SignupPage.tsx
import { useState, useEffect } from 'react';
import React from 'react'
import { Globe, Building2, Mail, Phone, User, Upload, ArrowRight, ArrowLeft, Check, Lock, Eye, EyeOff, PartyPopper } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import Carousel1 from "../../assets/Carousel 1.jpeg";
import Carousel2 from "../../assets/Carousel 2.jpeg";
import Carousel3 from "../../assets/Carousel 3.jpeg";
import LogoLight from '../../assets/Logo 3.jpeg';
import LogoDark from '../../assets/Logo 4.png';
import { apiPost } from '@/config/api';

interface SignupPageProps {
  onSignup: () => void;
  onBackToLogin: () => void;
  onBackToHome?: () => void;
}

// 3 dummy images for carousel - replace with your actual images later
const CAROUSEL_IMAGES = [
  Carousel1,
  Carousel2,
  Carousel3,
];

// Constant text - same for all carousel images
const BRAND_NAME = "BenchAstra";

// Designation options
const DESIGNATION_OPTIONS = [
  "CEO / Managing Director",
  "CTO / Technical Head",
  "HR Director / Manager",
  "Sales / Business Development Head",
  "Project Manager",
  "Team Lead",
  "Senior Developer",
  "Other"
];

// Industry options
const INDUSTRY_OPTIONS = [
  "Technology / IT",
  "Healthcare",
  "Finance / Banking",
  "Education",
  "Manufacturing",
  "Retail / E-commerce",
  "Consulting",
  "Real Estate",
  "Transportation / Logistics",
  "Media / Entertainment",
  "Other"
];

// Company size options
const COMPANY_SIZE_OPTIONS = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees"
];

export function SignupPage({ onSignup, onBackToLogin, onBackToHome }: SignupPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // OTP Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const [formData, setFormData] = useState({
    role: 'client' as 'client' | 'vendor',
    companyName: '',
    websiteUrl: '',
    industry: '',
    companySize: '',
    name: '',
    email: '',
    phoneNumber: '',
    designation: '',
    password: '',
    confirmPassword: '',
    otp: '',
    companyProof: null as File | null,
    agreeTerms: false,
  });

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-hide success message after 2 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
        onSignup();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage, onSignup]);

  // OTP Timer countdown effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !canResend) {
      setCanResend(true);
    }
  }, [timeLeft, canResend]);

  const startTimer = () => {
    setTimeLeft(60);
    setCanResend(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    return /^\d{10}$/.test(phone);
  };

  const isValidPassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'companyName':
        if (!value?.trim()) return 'Company name is required';
        return '';
      case 'name':
        if (!value?.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value?.trim()) return 'Email address is required';
        if (!isValidEmail(value)) return 'Please enter a valid email address (e.g., name@company.com)';
        return '';
      case 'phoneNumber':
        if (!value) return 'Phone number is required';
        if (!isValidPhone(value)) return 'Please enter a valid 10-digit phone number';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (!isValidPassword(value)) return 'Password must be at least 8 characters with uppercase, lowercase, and number';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      case 'designation':
        if (!value) return 'Please select your designation';
        return '';
      case 'agreeTerms':
        if (!value) return 'You must agree to the Terms & NDA';
        return '';
      case 'otp':
        if (!value || value.length !== 6) return 'Please enter the 6-digit OTP';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const errorMsg = validateField(field, formData[field as keyof typeof formData]);
    setFieldErrors(prev => ({ ...prev, [field]: errorMsg }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');

    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }

    if (touchedFields[field]) {
      setTouchedFields(prev => ({ ...prev, [field]: false }));
    }
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      handleInputChange('phoneNumber', digits);
    }
  };

  const handleEmailChange = (value: string) => {
    handleInputChange('email', value);
    if (error && error.includes('email')) {
      setError('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleInputChange('companyProof', e.target.files[0]);
    }
  };

  const validateStep1 = (): boolean => {
    const companyNameError = validateField('companyName', formData.companyName);
    if (companyNameError) {
      setError(companyNameError);
      setFieldErrors(prev => ({ ...prev, companyName: companyNameError }));
      setTouchedFields(prev => ({ ...prev, companyName: true }));
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const errors: string[] = [];

    const nameError = validateField('name', formData.name);
    if (nameError) errors.push(nameError);

    const emailError = validateField('email', formData.email);
    if (emailError) errors.push(emailError);

    const phoneError = validateField('phoneNumber', formData.phoneNumber);
    if (phoneError) errors.push(phoneError);

    const designationError = validateField('designation', formData.designation);
    if (designationError) errors.push(designationError);

    const passwordError = validateField('password', formData.password);
    if (passwordError) errors.push(passwordError);

    const confirmError = validateField('confirmPassword', formData.confirmPassword);
    if (confirmError) errors.push(confirmError);

    if (errors.length > 0) {
      setError(errors[0]);
      setTouchedFields({
        name: true,
        email: true,
        phoneNumber: true,
        designation: true,
        password: true,
        confirmPassword: true
      });
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    const otpError = validateField('otp', formData.otp);
    if (otpError) {
      setError(otpError);
      return false;
    }

    const termsError = validateField('agreeTerms', formData.agreeTerms);
    if (termsError) {
      setError(termsError);
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!validateStep2()) return;

      setLoading(true);
      setError('');
      try {
        const requestBody = {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          full_name: formData.name.trim(),
          phone: `+91${formData.phoneNumber}`,
          role: formData.role,
          company_name: formData.companyName.trim(),
          website: formData.websiteUrl.trim() || null,
          industry: formData.industry || null,
          company_size: formData.companySize || null,
          designation: formData.designation || null,
          vendor_name: formData.role === 'vendor' ? formData.companyName.trim() : null,
        };

        // Use apiPost instead of fetch
        const data = await apiPost('/auth/signup', requestBody);

        startTimer();
        setCurrentStep(3);
      } catch (err: any) {
        console.error('Signup error:', err);
        setError(err.message || 'Sign up failed. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);
    setError('');
    try {
      // Use apiPost instead of fetch
      await apiPost('/auth/verify-otp', {
        email: formData.email.trim().toLowerCase(),
        otp: formData.otp
      });

      // Show success message
      setShowSuccessMessage(true);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update handleResendOtp function
  const handleResendOtp = async () => {
    if (!canResend) return;

    setError('');
    setLoading(true);
    try {
      // Use apiPost instead of fetch
      await apiPost('/auth/send-otp', {
        email: formData.email.trim().toLowerCase()
      });
      startTimer();
    } catch (err: any) {
      setError(err.message || 'Could not resend OTP. Please try again.');
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
      {/* Success Toast Message */}
      {showSuccessMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-green-50 dark:bg-green-900/90 border border-green-200 dark:border-green-700 rounded-lg shadow-lg px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
              <PartyPopper size={18} className="text-white" />
            </div>
            <div>
              <p className="text-green-800 dark:text-green-200 font-semibold text-base">
                Account Created Successfully! 🎉
              </p>
              <p className="text-green-600 dark:text-green-300 text-xs">
                Redirecting to login...
              </p>
            </div>
          </div>
        </div>
      )}

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
          {/* Tagline - Single line with highlighted talent */}
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
          <div className="flex justify-start gap-2 mt-8">
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

      {/* Right Side - Form (unchanged) */}
      <div className="w-full lg:w-1/2 bg-white dark:bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="absolute top-6 left-6 right-6 z-20">
          <div className="flex items-center justify-between">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm transition-all duration-200 group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Home</span>
              </button>
            )}
            <div className={!onBackToHome ? 'ml-auto' : ''}>
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center py-6 px-6">
          {/* Mobile Logo */}
          <div className="lg:hidden absolute top-16 left-0 right-0 flex items-center justify-center gap-2">
            <span className="text-lg font-bold text-gray-800 dark:text-white">BenchAstra</span>
          </div>

          <div className="w-full max-w-md">
            <div className="text-center mb-5">
              <p className="text-gray-600 dark:text-gray-400 font-medium">Create your account</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {(['Company', 'Contact', 'Verify'] as const).map((label, i) => {
                const step = i + 1;
                return (
                  <div key={step} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-300 ${currentStep === step ? 'bg-blue-600 text-white font-semibold' :
                    currentStep > step ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                    }`}>
                    {currentStep > step ? <Check size={11} /> : <span>{step}</span>}
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} autoComplete="off">
              {/* Step 1: Company Details (unchanged) */}
              {currentStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['client', 'vendor'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleInputChange('role', r)}
                          className={`py-1.5 cursor-pointer text-xs font-semibold rounded-lg transition-all border ${formData.role === r
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                            }`}
                        >
                          {r === 'client' ? '🏢 Client' : '🤝 Vendor'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      onBlur={() => handleBlur('companyName')}
                      placeholder="Enter company name"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      className={`w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white ${touchedFields.companyName && fieldErrors.companyName ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                        }`} />
                    {touchedFields.companyName && fieldErrors.companyName && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.companyName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Website URL</label>
                    <div className="relative">
                      <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="url"
                        value={formData.websiteUrl}
                        onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                        placeholder="https://company.com"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Industry</label>
                      <select
                        value={formData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                        autoComplete="off"
                        className="w-full px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white">
                        <option value="">Select Industry</option>
                        {INDUSTRY_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Company Size</label>
                      <select
                        value={formData.companySize}
                        onChange={(e) => handleInputChange('companySize', e.target.value)}
                        autoComplete="off"
                        className="w-full px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white">
                        <option value="">Select Size</option>
                        {COMPANY_SIZE_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {error && (
                    <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-2 py-1.5">
                      {error}
                    </div>
                  )}

                  <button type="button" onClick={handleNext}
                    className="w-full cursor-pointer py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm">
                    Continue <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {/* Step 2: Contact Details (unchanged) */}
              {currentStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        onBlur={() => handleBlur('name')}
                        placeholder="Full name"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        className={`w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white ${touchedFields.name && fieldErrors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                          }`} />
                    </div>
                    {touchedFields.name && fieldErrors.name && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        onBlur={() => handleBlur('email')}
                        placeholder="you@company.com"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        className={`w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white ${touchedFields.email && fieldErrors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                          }`} />
                    </div>
                    {touchedFields.email && fieldErrors.email && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-gray-400">
                          <Phone size={12} />
                          <span className="text-[10px]">+91</span>
                        </div>
                        <input
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          onBlur={() => handleBlur('phoneNumber')}
                          placeholder="9876543210"
                          maxLength={10}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          className={`w-full pl-12 pr-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white ${touchedFields.phoneNumber && fieldErrors.phoneNumber ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                            }`} />
                      </div>
                      {touchedFields.phoneNumber && fieldErrors.phoneNumber && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.phoneNumber}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Designation <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Building2 size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                          value={formData.designation}
                          onChange={(e) => handleInputChange('designation', e.target.value)}
                          onBlur={() => handleBlur('designation')}
                          autoComplete="off"
                          className={`w-full pl-7 pr-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white ${touchedFields.designation && fieldErrors.designation ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                            }`}>
                          <option value="">Select Designation</option>
                          {DESIGNATION_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      {touchedFields.designation && fieldErrors.designation && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.designation}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        onBlur={() => handleBlur('password')}
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        className={`w-full pl-8 pr-7 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white ${touchedFields.password && fieldErrors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                          }`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {touchedFields.password && fieldErrors.password && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        onBlur={() => handleBlur('confirmPassword')}
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        className={`w-full pl-8 pr-7 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white ${touchedFields.confirmPassword && fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                          }`} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 text-gray-400">
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {touchedFields.confirmPassword && fieldErrors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>

                  {error && (
                    <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-2 py-1.5">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={handleBack} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                      <ArrowLeft size={12} /> Back
                    </button>
                    <button type="button" onClick={handleNext} disabled={loading}
                      className="flex-1 py-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm">
                      {loading ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Continue & Send OTP</span><ArrowRight size={14} /></>}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: OTP Verification (unchanged) */}
              {currentStep === 3 && (
                <div className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-blue-900 dark:text-blue-200 font-medium">Verification Email</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold break-all">{formData.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="px-3 py-1 text-xs cursor-pointer font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-100 dark:bg-blue-900/50 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Enter the 6-digit OTP sent to this email address</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Enter OTP <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.otp}
                      onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onBlur={() => handleBlur('otp')}
                      placeholder="••••••"
                      maxLength={6}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      className={`w-full px-3 py-2 text-center text-base tracking-[0.3em] bg-gray-50 dark:bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white ${touchedFields.otp && fieldErrors.otp ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                        }`} />
                    {touchedFields.otp && fieldErrors.otp && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.otp}</p>
                    )}
                  </div>

                  {/* OTP Timer and Resend Section */}
                  <div className="text-center">
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-sm cursor-pointer text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Didn't receive? <span className="font-medium text-blue-600 dark:text-blue-400">Resend OTP</span>
                      </button>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Resend available in <span className="font-semibold text-blue-600 dark:text-blue-400">{formatTime(timeLeft)}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Company Proof (optional)</label>
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-2 text-center hover:border-blue-400 transition-all cursor-pointer">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,image/*"
                        autoComplete="off" />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload size={18} className="mx-auto text-gray-400" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Click to upload</p>
                      </label>
                    </div>
                    {formData.companyProof && <p className="text-xs text-green-600 mt-1">Selected: {formData.companyProof.name}</p>}
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeTerms}
                      onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
                      autoComplete="off"
                      className="w-3.5 h-3.5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">I agree to the Terms of Service & NDA <span className="text-red-500">*</span></span>
                  </label>
                  {fieldErrors.agreeTerms && (
                    <p className="text-xs text-red-500">{fieldErrors.agreeTerms}</p>
                  )}

                  {error && (
                    <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-2 py-1.5">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={handleBack} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                      <ArrowLeft size={12} /> Back
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 py-1.5 bg-blue-600 cursor-pointer hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm">
                      {loading ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Verify & Create</span><ArrowRight size={14} /></>}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                Already have an account?{' '}
                <button type="button" onClick={onBackToLogin} className="text-blue-600 cursor-pointer hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}