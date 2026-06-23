// app.tsx (fixed with proper navigation and no blank tabs)
import { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { LandingPageV2 } from './components/LandingPageV2';
import { LoginPage } from './components/LoginPage';
import { RoleSelectionAfterLogin } from './components/RoleSelectionAfterLogin';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { EnterOTPPage } from './components/EnterOTPPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { PasswordResetSuccessPage } from './components/PasswordResetSuccessPage';
import { SignupPage } from './components/SignupPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { SearchResources } from './components/SearchResources';
import { Requirements } from './components/Requirements';
import { Resources } from './components/Resources';
import { Billing } from './components/Billing';
import { Settings } from './components/Settings';
import { PostRequirement } from './components/PostRequirement';
import { VendorSidebar } from './components/vendor/VendorSidebar';
import { VendorDashboard } from './components/vendor/VendorDashboard';
import { VendorResources } from './components/vendor/VendorResources';
import { VendorContracts } from './components/vendor/VendorContracts';
import { ScrollToTop } from './components/ScrollToTop';
import { Chatbot } from './components/Chatbot';
import { apiPost, apiGet, isTokenExpired, getToken, clearAuthData } from '@/config/api';
import '../styles/index.css';

type AuthFlow = 'landing' | 'login' | 'signup' | 'forgot-password' | 'enter-otp' | 'reset-password' | 'password-reset-success';

interface NavState {
  isLoggedIn: boolean;
  authFlow: AuthFlow;
  activePage: string;
  currentVendorPage: 'dashboard' | 'resources' | 'contracts';
  userRole: 'vendor' | 'client' | null;
  showRoleSelection: boolean;
}

// Wrapper component that provides both Theme and Toast contexts
function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Helper functions for localStorage persistence
const saveStateToLocalStorage = (state: NavState) => {
  try {
    localStorage.setItem('app_nav_state', JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
};

const loadStateFromLocalStorage = (): NavState | null => {
  try {
    const saved = localStorage.getItem('app_nav_state');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
  }
  return null;
};

// Check if user is authenticated
const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  return !!token;
};

export default function App() {
  // Initialize state from localStorage on page load
  const getInitialState = (): {
    isLoggedIn: boolean;
    authFlow: AuthFlow;
    activePage: string;
    currentVendorPage: 'dashboard' | 'resources' | 'contracts';
    userRole: 'vendor' | 'client' | null;
    showRoleSelection: boolean;
    userEmail: string;
  } => {
    // Check token first
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const savedState = loadStateFromLocalStorage();
    const savedRole = localStorage.getItem('user_role') as 'vendor' | 'client' | null;

    if (token && savedState && savedState.isLoggedIn) {
      // User was logged in before refresh
      return {
        isLoggedIn: true,
        authFlow: savedState.authFlow || 'landing',
        activePage: savedState.activePage || 'dashboard',
        currentVendorPage: savedState.currentVendorPage || 'dashboard',
        userRole: savedState.userRole || savedRole,
        showRoleSelection: savedState.showRoleSelection || false,
        userEmail: localStorage.getItem('user_email') || '',
      };
    } else if (token) {
      // Has token but no saved state - user was logged in
      return {
        isLoggedIn: true,
        authFlow: 'landing',
        activePage: 'dashboard',
        currentVendorPage: 'dashboard',
        userRole: savedRole,
        showRoleSelection: !savedRole,
        userEmail: localStorage.getItem('user_email') || '',
      };
    }

    // Not logged in
    if (savedState && !savedState.isLoggedIn) {
      return {
        isLoggedIn: false,
        authFlow: savedState.authFlow || 'landing',
        activePage: 'dashboard',
        currentVendorPage: 'dashboard',
        userRole: null,
        showRoleSelection: false,
        userEmail: '',
      };
    }

    return {
      isLoggedIn: false,
      authFlow: 'landing',
      activePage: 'dashboard',
      currentVendorPage: 'dashboard',
      userRole: null,
      showRoleSelection: false,
      userEmail: '',
    };
  };

  const initialState = getInitialState();

  const [isLoggedIn, setIsLoggedIn] = useState(initialState.isLoggedIn);
  const [authFlow, setAuthFlow] = useState<AuthFlow>(initialState.authFlow);
  const [resetEmail, setResetEmail] = useState('');
  const [userRole, setUserRole] = useState<'vendor' | 'client' | null>(initialState.userRole);
  const [showRoleSelection, setShowRoleSelection] = useState(initialState.showRoleSelection);
  const [activePage, setActivePage] = useState(initialState.activePage);
  const [showPostRequirement, setShowPostRequirement] = useState(false);
  const [searchFilters, setSearchFilters] = useState<{ jobId?: string; matchCount?: number }>({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentVendorPage, setCurrentVendorPage] = useState<'dashboard' | 'resources' | 'contracts'>(initialState.currentVendorPage);
  const [vendorSidebarCollapsed, setVendorSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(initialState.userEmail);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const navRef = useRef<NavState>({
    isLoggedIn: initialState.isLoggedIn,
    authFlow: initialState.authFlow,
    activePage: initialState.activePage,
    currentVendorPage: initialState.currentVendorPage,
    userRole: initialState.userRole,
    showRoleSelection: initialState.showRoleSelection
  });

  // Update ref when state changes
  useEffect(() => {
    navRef.current = { isLoggedIn, authFlow, activePage, currentVendorPage, userRole, showRoleSelection };
    saveStateToLocalStorage(navRef.current);
  }, [isLoggedIn, authFlow, activePage, currentVendorPage, userRole, showRoleSelection]);

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('access_token');

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePop = (e: PopStateEvent) => {
      if (isNavigating) return;

      const token = getToken();
      const isAuth = !!token;

      if (!isInitialized) return;

      if (!e.state) {
        if (isAuth) {
          // Don't redirect, just prevent
          return;
        }
        return;
      }

      const s = e.state as NavState;

      // If authenticated and trying to go to auth pages, prevent it
      if (isAuth && (s.authFlow === 'login' || s.authFlow === 'signup' || s.authFlow === 'landing' || s.authFlow === 'forgot-password')) {
        // Don't do anything, just return
        return;
      }

      // If authenticated and trying to go to role selection when role already selected
      if (isAuth && s.showRoleSelection === true && userRole !== null) {
        return;
      }

      // Update state from history
      const loggedIn = s.isLoggedIn && isAuth;
      setIsLoggedIn(loggedIn);
      setAuthFlow(loggedIn ? (s.authFlow ?? 'landing') : 'landing');
      setActivePage(s.activePage ?? 'dashboard');
      setCurrentVendorPage(s.currentVendorPage ?? 'dashboard');
      setUserRole(loggedIn ? (s.userRole ?? null) : null);
      setShowRoleSelection(s.showRoleSelection ?? false);
      setIsMobileSidebarOpen(false);
    };

    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [userRole, isInitialized, isNavigating]);

  // Initialize history on mount
  useEffect(() => {
    const token = getToken();
    const isAuth = !!token;

    if (isAuth && userRole) {
      const currentState = {
        isLoggedIn: true,
        authFlow: 'landing',
        activePage: activePage,
        currentVendorPage: currentVendorPage,
        userRole: userRole,
        showRoleSelection: false
      };
      window.history.replaceState(currentState, '', window.location.href);
    } else if (isAuth && showRoleSelection) {
      const currentState = {
        isLoggedIn: true,
        authFlow: 'landing',
        activePage: 'dashboard',
        currentVendorPage: 'dashboard',
        userRole: null,
        showRoleSelection: true
      };
      window.history.replaceState(currentState, '', window.location.href);
    } else if (!isAuth) {
      const currentState = {
        isLoggedIn: false,
        authFlow: authFlow,
        activePage: 'dashboard',
        currentVendorPage: 'dashboard',
        userRole: null,
        showRoleSelection: false
      };
      window.history.replaceState(currentState, '', window.location.href);
    }

    setIsInitialized(true);
  }, []);

  // Security: Check authentication
  useEffect(() => {
    if (isLoggedIn && !isAuthenticated()) {
      handleLogout();
    }
  }, [isLoggedIn]);

  const navigate = (updates: Partial<NavState>) => {
    const next: NavState = { ...navRef.current, ...updates };

    const token = getToken();
    if (token && (next.authFlow === 'login' || next.authFlow === 'signup' || next.authFlow === 'landing')) {
      return;
    }

    setIsNavigating(true);
    window.history.pushState(next, '');
    if (updates.isLoggedIn !== undefined) setIsLoggedIn(updates.isLoggedIn);
    if (updates.authFlow !== undefined) setAuthFlow(updates.authFlow);
    if (updates.activePage !== undefined) setActivePage(updates.activePage);
    if (updates.currentVendorPage !== undefined) setCurrentVendorPage(updates.currentVendorPage);
    if (updates.userRole !== undefined) setUserRole(updates.userRole);
    if (updates.showRoleSelection !== undefined) setShowRoleSelection(updates.showRoleSelection);

    setTimeout(() => setIsNavigating(false), 100);
  };

  // Add this helper function in App.tsx (around line 80)
  const isTokenValid = (): boolean => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (!token) return false;

    try {
      // Decode the JWT token to check expiry
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      if (exp) {
        const now = Math.floor(Date.now() / 1000);
        return now < exp;
      }
      return true; // If no exp, assume valid
    } catch (e) {
      return false;
    }
  };

  // Update the useEffect that checks authentication
  useEffect(() => {
    if (isLoggedIn) {
      if (!isAuthenticated() || !isTokenValid()) {
        handleLogout();
        setAuthFlow('login'); // Redirect to login page
      }
    }
  }, [isLoggedIn]);

  const handleLogin = async (email: string, password: string) => {
    // LoginPage already called /auth/login and stored tokens — just read from localStorage
    const role = localStorage.getItem('user_role');

    try {
      const userData = await apiGet('/users/me');
      setUserEmail(userData.email);
      localStorage.setItem('user_email', userData.email);
    } catch (err) {
      console.error('Failed to get user info:', err);
    }

    setIsLoggedIn(true);
    setShowRoleSelection(true);
    setAuthFlow('landing');

    if (role) {
      setUserRole(role as 'vendor' | 'client');
    }

    const newState = {
      isLoggedIn: true,
      authFlow: 'landing',
      activePage: 'dashboard',
      currentVendorPage: 'dashboard',
      userRole: role || null,
      showRoleSelection: true
    };
    window.history.replaceState(newState, '', window.location.href);

    return { success: true, role: role || undefined };
  };

  // Update the token validation useEffect
  useEffect(() => {
    if (isLoggedIn) {
      const token = getToken();
      if (!token || isTokenExpired(token)) {
        clearAuthData();
        setAuthFlow('login');
        setShowRoleSelection(false);
        setIsLoggedIn(false);
      }
    }
  }, [isLoggedIn]);

  const handleRoleSelection = (role: 'vendor' | 'client') => {
    // Get the user's actual role from session storage or the stored state
    const storedUser = sessionStorage.getItem('user');
    let actualRole = userRole;

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        actualRole = userData.role;
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }

    // Validate if selected role matches the user's actual role
    if (actualRole && actualRole !== role) {
      const errorMsg = actualRole === 'client'
        ? "You are registered as a client. Please continue as Client."
        : "You are registered as a vendor. Please continue as Vendor.";

      // Show error toast/notification
      alert(errorMsg); // You can replace this with your toast system
      return;
    }

    // Proceed with role selection
    localStorage.setItem('user_role', role);

    setUserRole(role);
    setShowRoleSelection(false);
    setActivePage('dashboard');

    const newState = {
      isLoggedIn: true,
      authFlow: 'landing',
      activePage: 'dashboard',
      currentVendorPage: 'dashboard',
      userRole: role,
      showRoleSelection: false
    };
    window.history.replaceState(newState, '', window.location.href);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('app_nav_state');
    setUserEmail('');

    // Simple redirect without replace to avoid blank tab
    window.location.href = '/';
  };

  const handleClientPageChange = (page: string) => {
    if (activePage === page) return; // Don't navigate to same page

    setActivePage(page);
    const currentState = { ...navRef.current, activePage: page };
    window.history.replaceState(currentState, '', window.location.href);
  };

  const handleSettingsClick = () => {
    if (activePage === 'settings') return;

    setActivePage('settings');
    const currentState = { ...navRef.current, activePage: 'settings' };
    window.history.replaceState(currentState, '', window.location.href);
  };

  const handleViewMatches = (jobId: string, matchCount: number) => {
    setSearchFilters({ jobId, matchCount });
    setActivePage('search');
    const currentState = { ...navRef.current, activePage: 'search' };
    window.history.replaceState(currentState, '', window.location.href);
  };

  const handleCreateNewRequirement = () => {
    setActivePage('post-requirement');
    setShowPostRequirement(true);
    const currentState = { ...navRef.current, activePage: 'post-requirement' };
    window.history.replaceState(currentState, '', window.location.href);
  };

  const handleVendorPageChange = (page: 'dashboard' | 'resources' | 'contracts') => {
    if (currentVendorPage === page) return;

    setCurrentVendorPage(page);
    const currentState = { ...navRef.current, currentVendorPage: page };
    window.history.replaceState(currentState, '', window.location.href);
  };

  const handleForgotPassword = () => navigate({ authFlow: 'forgot-password' });
  const handleSignup = () => navigate({ authFlow: 'signup' });
  const handleBackToLogin = () => navigate({ authFlow: 'login' });
  const handleLandingLogin = () => navigate({ authFlow: 'login' });
  const handleLandingGetStarted = () => navigate({ authFlow: 'signup' });
  const handleBackToHome = () => navigate({ authFlow: 'landing' });
  const handleSignupComplete = () => navigate({ authFlow: 'login' });

  const handleSendResetCode = (email: string) => {
    setResetEmail(email);
    navigate({ authFlow: 'enter-otp' });
  };

  const handleVerifyOTP = (code: string) => {
    console.log('OTP verified:', code);
    navigate({ authFlow: 'reset-password' });
  };

  const handleResendCode = () => {
    console.log('Resending code to:', resetEmail);
  };

  const handleResetPassword = (_password: string) => {
    navigate({ authFlow: 'password-reset-success' });
  };

  // Function to render the appropriate content based on state
  const renderContent = () => {
    // Auth screens (not logged in)
    if (!isLoggedIn) {
      if (authFlow === 'landing') {
        return <LandingPageV2 onLoginClick={handleLandingLogin} onGetStartedClick={handleLandingGetStarted} />;
      }
      if (authFlow === 'login') {
        return (
          <div>
            <LoginPage
              onLogin={handleLogin}
              onForgotPassword={handleForgotPassword}
              onSignup={handleSignup}
              onBackToHome={handleBackToHome}
            />
            <Chatbot
              isLoggedIn={false}
              userRole={null}  // ← ADD THIS LINE
              onLoginClick={handleLandingLogin}
              onSignupClick={handleLandingGetStarted}
            />
          </div>
        );
      }
      if (authFlow === 'signup') {
        return (
          <div>
            <SignupPage onSignup={handleSignupComplete} onBackToLogin={handleBackToLogin} onBackToHome={handleBackToHome} />
            <Chatbot
              isLoggedIn={false}
              userRole={null}  // ← ADD THIS LINE
              onLoginClick={handleLandingLogin}
              onSignupClick={handleLandingGetStarted}
            />
          </div>
        );
      }
      if (authFlow === 'forgot-password') {
        return (
          <div>
            <ForgotPasswordPage onBackToLogin={handleBackToLogin} onSendCode={handleSendResetCode} />
            <Chatbot
              isLoggedIn={false}
              userRole={null}  // ← ADD THIS LINE
              onLoginClick={handleLandingLogin}
              onSignupClick={handleLandingGetStarted}
            />
          </div>
        );
      }
      if (authFlow === 'enter-otp') {
        return (
          <div>
            <EnterOTPPage
              email={resetEmail}
              onBackToLogin={handleBackToLogin}
              onVerifyCode={handleVerifyOTP}
              onResendCode={handleResendCode}
            />
            <Chatbot
              isLoggedIn={false}
              userRole={null}
              onLoginClick={handleLandingLogin}
              onSignupClick={handleLandingGetStarted}
            />
          </div>
        );
      }
      if (authFlow === 'reset-password') {
        return (
          <div>
            <ResetPasswordPage onBackToLogin={handleBackToLogin} onResetPassword={handleResetPassword} />
            <Chatbot
              isLoggedIn={false}
              userRole={null}  // ← ADD THIS LINE
              onLoginClick={handleLandingLogin}
              onSignupClick={handleLandingGetStarted}
            />
          </div>
        );
      }
      if (authFlow === 'password-reset-success') {
        return (
          <div>
            <PasswordResetSuccessPage onBackToLogin={handleBackToLogin} />
            <Chatbot
              isLoggedIn={false}
              userRole={null}  // ← ADD THIS LINE
              onLoginClick={handleLandingLogin}
              onSignupClick={handleLandingGetStarted}
            />
          </div>
        );
      }
    }

    // Role selection after login
    if (isLoggedIn && showRoleSelection) {
      return (
        <>
          <RoleSelectionAfterLogin
            onSelectRole={handleRoleSelection}
            onLogout={handleLogout}
            userEmail={userEmail}
          />
          <Chatbot
            isLoggedIn={true}
            userRole={null}  // Role not selected yet
            onLoginClick={handleLandingLogin}
            onSignupClick={handleLandingGetStarted}
          />
        </>
      );
    }

    // Vendor Portal
    if (userRole === 'vendor') {
      return (
        <div className="min-h-screen bg-background">
          <VendorSidebar
            currentPage={currentVendorPage}
            onNavigate={handleVendorPageChange}
            isCollapsed={vendorSidebarCollapsed}
            onToggleCollapse={() => setVendorSidebarCollapsed(!vendorSidebarCollapsed)}
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
          />
          <Header
            onLogout={handleLogout}
            onSettingsClick={handleSettingsClick}
            sidebarCollapsed={vendorSidebarCollapsed}
            onMobileMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          />

          <main className={`min-h-screen pt-16 md:pt-20 transition-all duration-300 ${vendorSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
            <div className="p-4 md:p-8 min-h-[calc(100vh-5rem)] bg-slate-50 dark:bg-slate-900">
              {currentVendorPage === 'dashboard' && (
                <VendorDashboard onNavigate={handleVendorPageChange} />
              )}
              {currentVendorPage === 'resources' && <VendorResources />}
              {currentVendorPage === 'contracts' && <VendorContracts />}
            </div>
          </main>

          <ScrollToTop />
          <Chatbot
            isLoggedIn={true}
            userRole={userRole}  // ← ADD THIS LINE
            onLoginClick={handleLandingLogin}
            onSignupClick={handleLandingGetStarted}
          />
        </div>
      );
    }

    // Client Portal
    if (userRole === 'client') {
      return (
        <div className="min-h-screen bg-background">
          <Sidebar
            activePage={activePage}
            onPageChange={handleClientPageChange}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
          />
          <Header
            onLogout={handleLogout}
            onSettingsClick={handleSettingsClick}
            sidebarCollapsed={isSidebarCollapsed}
            onMobileMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          />

          <main className={`min-h-screen pt-16 md:pt-20 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
            <div className="p-4 md:p-8 min-h-[calc(100vh-5rem)] bg-slate-50 dark:bg-slate-900">
              {activePage === 'dashboard' && <Dashboard onViewMatches={handleViewMatches} />}
              {activePage === 'search' && (
                <SearchResources
                  preFilteredJobId={searchFilters.jobId}
                  preFilteredCount={searchFilters.matchCount}
                />
              )}
              {(activePage === 'post-requirement' || showPostRequirement) && (
                <PostRequirement
                  onClose={() => {
                    setShowPostRequirement(false);
                    setActivePage('dashboard');
                    const currentState = { ...navRef.current, activePage: 'dashboard' };
                    window.history.replaceState(currentState, '', window.location.href);
                  }}
                />
              )}
              {activePage === 'requirements' && (
                <Requirements onViewMatches={handleViewMatches} onCreateNew={handleCreateNewRequirement} />
              )}
              {activePage === 'resources' && <Resources />}
              {activePage === 'billing' && <Billing />}
              {activePage === 'settings' && <Settings />}
            </div>
          </main>

          <ScrollToTop />
          <Chatbot
            isLoggedIn={true}
            userRole={userRole}  // ← ADD THIS LINE
            onLoginClick={handleLandingLogin}
            onSignupClick={handleLandingGetStarted}
          />
        </div>
      );
    }

    return null;
  };

  // Wrap everything with providers
  return (
    <AppProviders>
      {renderContent()}
    </AppProviders>
  );
}