// components/ProtectedRoute.tsx
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    
    if (!token) {
      window.location.href = '/';
      return;
    }

    // Prevent back button navigation to auth pages
    const handlePopState = () => {
      const currentToken = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (currentToken) {
        // Still logged in, stay on current page
        window.history.pushState(null, '', window.location.href);
      } else {
        window.location.href = '/';
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return <>{children}</>;
}