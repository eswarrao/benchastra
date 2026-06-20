import { useState, useEffect } from 'react';
import React from 'react'
import { Users, Briefcase, ArrowRight, CheckCircle, LogOut, XCircle } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import LogoLight from '../../assets/Logo 3.jpeg';
import LogoDark from '../../assets/Logo 4.png';

interface RoleSelectionAfterLoginProps {
  onSelectRole: (role: 'vendor' | 'client') => void;
  onLogout: () => void;
  userEmail?: string;
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

export function RoleSelectionAfterLogin({ onSelectRole, onLogout, userEmail }: RoleSelectionAfterLoginProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  // Get user's actual role from session storage
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserRole(userData.role);
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
  }, []);

  // Auto-hide error message after 4 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
        setShake(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Prevent body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleRoleSelection = (selectedRole: 'vendor' | 'client') => {
    // Validate if selected role matches the user's actual role
    if (userRole && userRole !== selectedRole) {
      const errorMsg = userRole === 'client'
        ? "You are registered as a client. Please continue as Client."
        : "You are registered as a vendor. Please continue as Vendor.";

      setErrorMessage(errorMsg);
      setShake(true);

      // Add haptic feedback for mobile
      if (navigator.vibrate) navigator.vibrate(50);
      return;
    }

    // Clear any existing error and proceed
    setErrorMessage(null);
    setShake(false);
    onSelectRole(selectedRole);
  };

  // Dynamic background based on theme - matching the image
  const getBackgroundStyle = () => {
    if (isDark) {
      return 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)';
    }
    // Matching the image's blue gradient
    return 'linear-gradient(135deg, #1a4fa3 0%, #1e62c4 45%, #1a8fd1 100%)';
  };

  // Get role display name
  const getRoleDisplayName = (role: string | null) => {
    if (!role) return '';
    return role === 'client' ? 'Client' : 'Vendor';
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{
        height: '100vh',
        width: '100vw',
        maxWidth: '100%',
        overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: getBackgroundStyle(),
      }}
    >
      {/* Toast Error Message - Enhanced */}
      {errorMessage && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-300 ${shake ? 'animate-shake' : ''
            }`}
        >
          <div className="flex items-center gap-3 px-5 py-3 bg-red-500 text-white rounded-xl shadow-2xl backdrop-blur-sm border border-red-400 max-w-md">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-400/30 flex items-center justify-center">
              <XCircle size={18} className="flex-shrink-0" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">Access Restricted</span>
              <span className="text-xs font-medium opacity-90">{errorMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Decorative elements - matching the image style */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at 15% 50%, rgba(255,255,255,0.03) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(255,255,255,0.02) 0%, transparent 50%)'
            : 'radial-gradient(ellipse at 15% 50%, rgba(255,255,255,0.07) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(255,255,255,0.05) 0%, transparent 50%)',
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
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
          border: isDark ? '1.5px solid rgba(255,255,255,0.08)' : '1.5px solid rgba(255,255,255,0.18)',
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
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
          border: isDark ? '1.5px solid rgba(255,255,255,0.06)' : '1.5px solid rgba(255,255,255,0.13)',
          backdropFilter: 'blur(2px)',
          transform: 'rotate(-12deg)',
        }}
      />

      {/* Header with Logout and Theme Toggle */}
      <div className="absolute top-0 right-0 z-30 p-4 flex items-center gap-3">
        {userEmail && (
          <span className="text-white/80 text-sm hidden sm:block">{userEmail}</span>
        )}
        <button
          onClick={onLogout}
          className="flex cursor-pointer items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm border border-white/20"
        >
          <LogOut size={16} />
          <span className="text-sm font-medium hidden sm:inline">Logout</span>
        </button>
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-start px-4 sm:px-6 w-full max-w-full">

        {/* Logo and Heading - matching image style */}
        {/* Logo and Heading - matching image style */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl mb-2 -mt-8"
          style={{
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
            border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.25)',
          }}
        >
          <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0">
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
          <span className="text-white font-bold text-[14px] tracking-tight">BenchAstra</span>
        </div>

        {/* Role Cards - matching the image layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[760px]">
          {/* Vendor Card - Green accent as shown in image */}
          <RoleCard
            iconBg="#22c55e"
            icon={<Users size={26} color="white" />}
            title="I'm a Vendor"
            description="Showcase your talented resources, manage availability, and connect with companies looking for skilled professionals."
            features={vendorFeatures}
            checkColor="#22c55e"
            btnBg="#16a34a"
            btnHover="#15803d"
            btnLabel="Continue as Vendor"
            onClick={() => handleRoleSelection('vendor')}
            isDark={isDark}
            isDisabled={userRole === 'client'}
            userRole={userRole}
          />

          {/* Client Card - Blue accent as shown in image */}
          <RoleCard
            iconBg="#3b82f6"
            icon={<Briefcase size={26} color="white" />}
            title="I'm a Client"
            description="Post job requirements, discover pre-vetted talent, and build your team with the right professionals quickly."
            features={clientFeatures}
            checkColor="#3b82f6"
            btnBg="#2563eb"
            btnHover="#1d4ed8"
            btnLabel="Continue as Client"
            onClick={() => handleRoleSelection('client')}
            isDark={isDark}
            isDisabled={userRole === 'vendor'}
            userRole={userRole}
          />
        </div>

        {/* Footer Note - matching image style */}
        <p className="text-[12px] font-medium mt-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
          You can switch roles anytime from your account settings
        </p>
      </div>

      {/* Add shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(-50%) rotate(0deg); }
          10% { transform: translateX(-50%) rotate(2deg); }
          20% { transform: translateX(-50%) rotate(-2deg); }
          30% { transform: translateX(-50%) rotate(2deg); }
          40% { transform: translateX(-50%) rotate(-2deg); }
          50% { transform: translateX(-50%) rotate(1deg); }
          60% { transform: translateX(-50%) rotate(-1deg); }
          70% { transform: translateX(-50%) rotate(0.5deg); }
          80% { transform: translateX(-50%) rotate(-0.5deg); }
          90% { transform: translateX(-50%) rotate(0deg); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

// Role Card Component - Updated with cleaner style matching the image
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
  isDark?: boolean;
  isDisabled?: boolean;
  userRole?: string | null;
}

function RoleCard({
  iconBg, icon, title, description, features,
  checkColor, btnBg, btnHover, btnLabel, onClick,
  isDark = false,
  isDisabled = false,
  userRole = null,
}: RoleCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!isDisabled) {
      onClick();
    }
  };

  // Get the correct role name for display
  const getDisabledReason = () => {
    if (!userRole) return '';
    return userRole === 'client'
      ? 'You are registered as a Client'
      : 'You are registered as a Vendor';
  };

  return (
    <div
      className={`rounded-2xl flex flex-col overflow-hidden transition-all duration-250 relative ${isDisabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
        }`}
      style={{
        background: isDark ? '#1e293b' : '#ffffff',
        transform: isHovered && !isDisabled ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered && !isDisabled
          ? (isDark ? '0 20px 44px rgba(0,0,0,0.4)' : '0 20px 44px rgba(0,0,0,0.15)')
          : (isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'),
        border: isDisabled ? `2px solid ${isDark ? '#dc2626' : '#fca5a5'}` : '2px solid transparent',
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Disabled Overlay */}
      {isDisabled && (
        <div className="absolute inset-0 bg-black/5 dark:bg-white/5 flex items-center justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100/90 dark:bg-red-900/80 backdrop-blur-sm border border-red-300 dark:border-red-700">
            <span className="text-xs font-bold text-red-600 dark:text-red-300">
              ⚠️ Not Your Role
            </span>
            <span className="text-[10px] font-medium text-red-500 dark:text-red-400">
              {getDisabledReason()}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 p-5 pb-4">
        <div
          className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 ${!isDisabled && isHovered ? 'scale-105' : ''
            }`}
          style={{
            background: isDisabled ? '#94a3b8' : iconBg,
            opacity: isDisabled ? 0.6 : 1,
          }}
        >
          {icon}
        </div>

        <h2
          className="text-[19px] font-bold mb-2"
          style={{
            color: isDark ? '#f1f5f9' : '#1e293b',
            letterSpacing: '-0.3px',
            opacity: isDisabled ? 0.6 : 1,
          }}
        >
          {title}
        </h2>

        <p
          className="text-[12.5px] leading-relaxed mb-4"
          style={{
            color: isDark ? '#94a3b8' : '#64748b',
            opacity: isDisabled ? 0.6 : 1,
          }}
        >
          {description}
        </p>

        <ul className="flex flex-col gap-2">
          {features.map((f) => (
            <li
              key={f}
              className="flex items-center gap-2 text-[12.5px] font-medium"
              style={{
                color: isDark ? '#cbd5e1' : '#334155',
                opacity: isDisabled ? 0.6 : 1,
              }}
            >
              <CheckCircle
                size={14}
                style={{
                  color: isDisabled ? '#94a3b8' : checkColor,
                  flexShrink: 0
                }}
              />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <button
        className={`w-full py-3.5 flex items-center justify-center gap-2 text-white text-[13.5px] font-bold transition-all duration-150 touch-manipulation ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
        style={{
          background: isDisabled ? '#94a3b8' : btnBg,
          borderRadius: '0 0 16px 16px',
          letterSpacing: '0.1px',
          opacity: isDisabled ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            (e.currentTarget as HTMLButtonElement).style.background = btnHover;
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            (e.currentTarget as HTMLButtonElement).style.background = btnBg;
          }
        }}
        disabled={isDisabled}
      >
        {isDisabled ? (
          <>
            <span>Not Available</span>
            <XCircle size={16} />
          </>
        ) : (
          <>
            {btnLabel} <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}