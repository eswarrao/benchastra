// components/Header.tsx - Updated with green theme for vendor role and fixed company data
import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { ChevronDown, Settings, LogOut, Search, Menu, User, Mail, Phone, Building2, Camera, Trash2, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NotificationPanel } from './NotificationPanel';
import { useToast } from '../contexts/ToastContext';

interface HeaderProps {
  onLogout?: () => void;
  onSettingsClick?: () => void;
  sidebarCollapsed?: boolean;
  onMobileMenuToggle?: () => void;
}

export function Header({
  onLogout,
  onSettingsClick,
  sidebarCollapsed = false,
  onMobileMenuToggle,
}: HeaderProps) {
  const { showSuccess, showError } = useToast();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [user, setUser] = useState({ name: '', email: '', phone: '', company: '', role: '', profile_picture: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState<'vendor' | 'client' | null>(null);
  const [editingUser, setEditingUser] = useState({ name: '', phone: '' });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Token refresh function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return false;
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // API call with token refresh
  const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let token = localStorage.getItem('token') || localStorage.getItem('access_token');
    
    if (!token) {
      window.location.href = '/login';
      throw new Error('No token found');
    }
    
    const makeRequest = async (retryToken?: string) => {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${retryToken || token}`
      };
      
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers || {})
        }
      });
      
      return response;
    };
    
    let response = await makeRequest();
    
    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        const newToken = localStorage.getItem('token') || localStorage.getItem('access_token');
        response = await makeRequest(newToken);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }
    
    return response;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && showSettingsModal) {
        setShowSettingsModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettingsModal]);

  // Fetch user data from API
  const fetchUser = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role') as 'vendor' | 'client' | null;
    setUserRole(role);

    if (!token) {
      setUser({ name: 'Guest', email: 'guest@example.com', phone: '', company: '', role: '', profile_picture: '' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithAuth('/api/users/me');
      
      if (response.ok) {
        const userData = await response.json();
        console.log('User data from API:', userData); // Debug log
        
        let displayName = userData.full_name;
        if (!displayName || displayName === '') {
          displayName = userData.email ? userData.email.split('@')[0] : 'User';
        }

        // Get company name from nested company object or root level
        const companyName = userData.company?.name || userData.company_name || '';

        setUser({
          name: displayName,
          email: userData.email || 'No email',
          phone: userData.phone || '',
          company: companyName,
          role: userData.role || role || '',
          profile_picture: userData.profile_picture || '',
        });

        setEditingUser({
          name: displayName,
          phone: userData.phone || '',
        });

        setProfileImage(userData.profile_picture || null);
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser({ name: 'Guest', email: 'Please login again', phone: '', company: '', role: '', profile_picture: '' });
      } else {
        setError(true);
        setUser({ name: 'Error', email: 'Failed to load', phone: '', company: '', role: '', profile_picture: '' });
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError(true);
      setUser({ name: 'Error', email: 'Connection failed', phone: '', company: '', role: '', profile_picture: '' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token) {
      fetch('/api/notifications/?unread_only=true', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => setUnreadCount(Array.isArray(data) ? data.length : 0))
        .catch(() => { });
    }
  }, []);

  const getInitials = () => {
    if (loading) return '...';
    if (user.name && user.name !== '') {
      return user.name.charAt(0).toUpperCase();
    }
    if (user.email && user.email !== '') {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Updated: Green for vendor, Blue for client
  const getAvatarGradient = () => {
    if (userRole === 'vendor') {
      return 'from-green-600 to-emerald-600';
    }
    return 'from-blue-600 to-cyan-600';
  };

  const getShadowColor = () => {
    if (userRole === 'vendor') {
      return 'shadow-green-500/30';
    }
    return 'shadow-blue-500/30';
  };

  const getRingColor = () => {
    if (userRole === 'vendor') {
      return 'ring-green-100 dark:ring-green-900/50 group-hover:ring-green-200';
    }
    return 'ring-blue-100 dark:ring-blue-900/50 group-hover:ring-blue-200';
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showError('Image size should be less than 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showError('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result as string;

        const token = localStorage.getItem('token') || localStorage.getItem('access_token');
        const response = await fetchWithAuth('/api/users/me/profile-picture', {
          method: 'PUT',
          body: JSON.stringify({ profile_picture: imageData }),
        });

        if (response.ok) {
          setProfileImage(imageData);
          setUser(prev => ({ ...prev, profile_picture: imageData }));
          showSuccess('Profile picture updated successfully!');
        } else {
          const error = await response.json();
          showError(error.detail || 'Failed to update profile picture');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      showError('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;

    try {
      const response = await fetchWithAuth('/api/users/me/profile-picture', {
        method: 'DELETE',
      });

      if (response.ok) {
        setProfileImage(null);
        setUser(prev => ({ ...prev, profile_picture: '' }));
        showSuccess('Profile picture removed successfully!');
      } else {
        showError('Failed to remove profile picture');
      }
    } catch (error) {
      console.error('Error removing profile picture:', error);
      showError('Error removing profile picture');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await fetchWithAuth('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: editingUser.name,
          phone: editingUser.phone,
        }),
      });

      if (response.ok) {
        setUser(prev => ({ ...prev, name: editingUser.name, phone: editingUser.phone }));
        setShowSettingsModal(false);
        showSuccess('Profile updated successfully!');
        fetchUser();
      } else {
        const error = await response.json();
        showError(error.detail || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Error updating profile');
    }
  };

  const handleSettingsClickWrapper = () => {
    setShowProfileDropdown(false);
    setShowSettingsModal(true);
  };

  return (
    <>
      <header className={`h-16 md:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between px-4 md:px-8 fixed top-0 right-0 z-40 transition-all duration-300 shadow-sm left-0 ${sidebarCollapsed ? 'md:left-20' : 'md:left-64'}`}>
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors mr-2 flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={22} className="text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
        </button>

        {/* Left Section - Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            {/* Search input is commented out */}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <NotificationPanel unreadCount={unreadCount} onCountChange={setUnreadCount} />

          <div className="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>

          {/* User Profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center cursor-pointer gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-3 py-2.5 transition-all duration-200 group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-white font-semibold shadow-lg ${getShadowColor()} ring-2 ${getRingColor()} group-hover:ring-2 transition-all overflow-hidden`}>
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials()
                )}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {loading ? 'Loading...' : (error ? 'Error' : user.name)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {loading ? 'Please wait...' : (error ? 'Check console' : user.email)}
                </div>
              </div>
              <ChevronDown size={18} className={`text-slate-500 dark:text-slate-400 transition-transform duration-200 hidden md:block ${showProfileDropdown ? 'rotate-180' : ''}`} strokeWidth={2.5} />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-white font-semibold shadow-lg ${getShadowColor()} text-lg overflow-hidden`}>
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        getInitials()
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {loading ? 'Loading...' : (error ? 'Error' : user.name)}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {loading ? '...' : (error ? 'Failed to load' : user.email)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={handleSettingsClickWrapper}
                    className="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Settings size={18} className="text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
                    </div>
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onLogout?.();
                    }}
                    className="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                      <LogOut size={18} className="text-red-600 dark:text-red-400" strokeWidth={2.5} />
                    </div>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div ref={modalRef} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors z-10"
              aria-label="Close settings"
            >
              <X size={20} className="text-slate-500 dark:text-slate-400" />
            </button>

            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Profile Settings</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your profile information</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-white text-3xl font-bold overflow-hidden`}>
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      getInitials()
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera size={14} className="text-white" />
                    <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" disabled={uploading} />
                  </label>
                  {profileImage && (
                    <button
                      onClick={handleRemoveProfilePicture}
                      className="absolute bottom-0 left-0 p-1.5 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={14} className="text-white" />
                    </button>
                  )}
                </div>
                {uploading && <p className="text-xs text-slate-500 mt-2">Uploading...</p>}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Click camera to change, trash to remove</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <User size={14} className="inline mr-1" /> Full Name
                </label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Mail size={14} className="inline mr-1" /> Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Phone size={14} className="inline mr-1" /> Phone Number
                </label>
                <input
                  type="tel"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Company/Organization - Fixed to show correct data */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Building2 size={14} className="inline mr-1" /> Organization
                </label>
                <input
                  type="text"
                  value={user.company || 'Not specified'}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Organization name from your profile</p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${userRole === 'vendor'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                  {userRole === 'vendor' ? 'Vendor' : 'Client'}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                className="flex-1 cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}