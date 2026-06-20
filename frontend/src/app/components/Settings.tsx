import { useEffect, useState } from 'react';
import { Bell, Shield, CreditCard, User, Building2, Save, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface CompanyData {
  name: string;
  website: string;
  industry: string;
  description: string;
  size?: string;
}

interface UserData {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  designation: string;
  role?: string;
  company_id?: number;
  company?: CompanyData;
}

export function Settings() {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState<UserData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    designation: '',
    company: {
      name: '',
      website: '',
      industry: '',
      description: '',
    }
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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

  // Fetch user data on load
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setFetching(true);
        const response = await fetchWithAuth('/api/users/me');

        if (response.ok) {
          const data = await response.json();
          
          console.log('User data received:', data);
          
          // Parse full_name into first and last name
          const fullName = data.full_name || '';
          const nameParts = fullName.split(' ');
          const firstName = data.first_name || nameParts[0] || '';
          const lastName = data.last_name || nameParts.slice(1).join(' ') || '';
          
          // Get company data (either nested or at root level)
          const companyData = data.company || {};
          
          setFormData({
            id: data.id,
            first_name: firstName,
            last_name: lastName,
            email: data.email || '',
            phone: data.phone || '',
            designation: data.designation || '',
            role: data.role || '',
            company_id: data.company_id || companyData.id,
            company: {
              name: companyData.name || data.company_name || '',
              website: companyData.website || data.website || '',
              industry: companyData.industry || data.industry || '',
              description: companyData.description || data.description || '',
              size: companyData.size || data.company_size || '',
            }
          });
        } else {
          const error = await response.json();
          showError(error.detail || 'Failed to load user data');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        showError('Failed to load user data');
      } finally {
        setFetching(false);
      }
    };

    fetchUser();
  }, []);

  // Update user profile
  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Prepare update data
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name: `${formData.first_name} ${formData.last_name}`.trim(),
        phone: formData.phone,
        designation: formData.designation,
        company: {
          name: formData.company?.name || '',
          website: formData.company?.website || '',
          industry: formData.company?.industry || '',
          description: formData.company?.description || '',
        }
      };

      const response = await fetchWithAuth('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Update response:', data);
        
        const companyData = data.company || {};
        const fullName = data.full_name || '';
        const nameParts = fullName.split(' ');
        
        setFormData({
          ...formData,
          first_name: data.first_name || nameParts[0] || formData.first_name,
          last_name: data.last_name || nameParts.slice(1).join(' ') || formData.last_name,
          email: data.email || formData.email,
          phone: data.phone || formData.phone,
          designation: data.designation || formData.designation,
          company: {
            name: companyData.name || data.company_name || formData.company?.name || '',
            website: companyData.website || data.website || formData.company?.website || '',
            industry: companyData.industry || data.industry || formData.company?.industry || '',
            description: companyData.description || data.description || formData.company?.description || '',
          }
        });
        
        showSuccess('Profile updated successfully!');
      } else {
        const error = await response.json();
        showError(error.detail || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-primary animate-spin" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Manage your account preferences and settings</p>
        {formData.role && (
          <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
            Role: {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Profile */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                <Building2 size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Company Profile</h2>
                <p className="text-sm text-muted-foreground">Update your company information</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Company Name</label>
                <input
                  type="text"
                  value={formData.company?.name || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    company: { ...formData.company!, name: e.target.value } 
                  })}
                  placeholder="Enter company name"
                  className="w-full h-11 px-4 bg-secondary/30 dark:bg-slate-700 border border-input dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground dark:text-slate-200 placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Website</label>
                <input
                  type="url"
                  value={formData.company?.website || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    company: { ...formData.company!, website: e.target.value } 
                  })}
                  placeholder="https://example.com"
                  className="w-full h-11 px-4 bg-secondary/30 dark:bg-slate-700 border border-input dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground dark:text-slate-200 placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Industry</label>
                <select
                  value={formData.company?.industry || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    company: { ...formData.company!, industry: e.target.value } 
                  })}
                  className="w-full h-11 px-4 bg-secondary/30 dark:bg-slate-700 border border-input dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground dark:text-slate-200"
                >
                  <option value="">Select Industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Education">Education</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
                <textarea
                  rows={4}
                  value={formData.company?.description || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    company: { ...formData.company!, description: e.target.value } 
                  })}
                  placeholder="Tell us about your company..."
                  className="w-full px-4 py-3 bg-secondary/30 dark:bg-slate-700 border border-input dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none text-foreground dark:text-slate-200 placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                <User size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">User Profile</h2>
                <p className="text-sm text-muted-foreground">Update your personal information</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="First name"
                    className="w-full h-11 px-4 bg-secondary/30 dark:bg-slate-700 border border-input dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground dark:text-slate-200 placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Last name"
                    className="w-full h-11 px-4 bg-secondary/30 dark:bg-slate-700 border border-input dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground dark:text-slate-200 placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g., Senior Developer, Team Lead"
                  className="w-full h-11 px-4 bg-secondary/30 dark:bg-slate-700 border border-input dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground dark:text-slate-200 placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full h-11 px-4 bg-secondary/30 dark:bg-slate-700 border border-input dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground dark:text-slate-200 placeholder:text-muted-foreground"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full h-11 px-4 bg-secondary/30 dark:bg-slate-700 border border-input dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground dark:text-slate-200 placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Info Cards */}
        <div className="space-y-6">
          {/* Billing Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                <CreditCard size={20} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Billing Summary</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Current Plan</span>
                <span className="text-sm font-semibold text-foreground">Premium</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Billing Cycle</span>
                <span className="text-sm font-semibold text-foreground">Monthly</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-muted-foreground">Next Billing</span>
                <span className="text-sm font-semibold text-foreground">15 Apr 2024</span>
              </div>

              <button className="w-full h-10 border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold cursor-pointer rounded-xl transition-all duration-200">
                Manage Billing
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                <Bell size={20} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Notifications</h2>
            </div>

            <div className="space-y-4">
              {[
                'Email notifications',
                'New candidate matches',
                'Application updates',
                'Weekly digest',
              ].map((item, idx) => (
                <label key={idx} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {item}
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked={idx < 2}
                    className="w-11 h-6 rounded-full appearance-none bg-gray-300 dark:bg-slate-600 checked:bg-primary relative cursor-pointer transition-colors
                      before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5
                      before:transition-transform checked:before:translate-x-5"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Security</h2>
            </div>

            {/* <div className="space-y-3">
              <button className="w-full h-10 cursor-pointer text-sm font-semibold text-primary hover:bg-blue-50 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 text-left px-4">
                Change Password
              </button>
              <button className="w-full h-10 cursor-pointer text-sm font-semibold text-primary hover:bg-blue-50 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 text-left px-4">
                Enable Two-Factor Auth
              </button>
            </div> */}
          </div>
        </div>
      </div>

      {/* Save All Changes Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-8 py-3 bg-primary cursor-pointer hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Save All Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}