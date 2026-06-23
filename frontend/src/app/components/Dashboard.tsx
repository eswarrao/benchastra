// Dashboard.tsx - Updated with token refresh, better error handling, and upload loader
import { useState, useEffect } from 'react';
import { Users, FileText, DollarSign, Clock, TrendingUp, TrendingDown, MapPin, Briefcase, Target, Plus, Upload, ArrowRight, Activity, X, Download, Loader2 } from 'lucide-react';
import { PostRequirement } from './PostRequirement';
import { useToast } from '../contexts/ToastContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface DashboardProps {
  onViewMatches?: (jobId: string, matchCount: number) => void;
}

export function Dashboard({ onViewMatches }: DashboardProps) {
  const { showSuccess, showError } = useToast();
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [stats, setStats] = useState({
    totalRequirements: 0,
    openRequirements: 0,
    closedRequirements: 0,
    totalMatchingProfiles: 0
  });
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');
  const [requirementsByRole, setRequirementsByRole] = useState<{ role: string; count: number }[]>([]);
  const [showPostRequirement, setShowPostRequirement] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('access_token');

  // Token refresh function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return false;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
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
    let token = getToken();

    if (!token) {
      window.location.href = '/login';
      throw new Error('No token found');
    }

    const makeRequest = async (retryToken?: string) => {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${retryToken || token}`
      };

      // For FormData, remove Content-Type header
      if (options.body instanceof FormData) {
        delete headers['Content-Type'];
      }

      const response = await fetch(url, {
        ...options,
        headers
      });

      return response;
    };

    let response = await makeRequest();

    // If token expired, try to refresh
    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        const newToken = getToken();
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

  // Fetch dashboard stats from API
  const fetchStats = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/dashboard/client/stats`);

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalRequirements: data.total_requirements || 0,
          openRequirements: data.open_requirements || 0,
          closedRequirements: data.closed_requirements || 0,
          totalMatchingProfiles: data.total_matching_profiles || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchRequirements = async () => {
    try {
      const url = `${API_BASE_URL}/requirements/?limit=10`;
      const response = await fetchWithAuth(url);

      if (response.ok) {
        const data = await response.json();
        setRequirements(data);

        // Calculate requirements by role for chart
        const roleCounts: Record<string, number> = {};
        data.forEach((req: any) => {
          const role = req.role.split(' ')[0];
          roleCounts[role] = (roleCounts[role] || 0) + 1;
        });
        const roleArray = Object.entries(roleCounts).map(([role, count]) => ({ role, count }));
        setRequirementsByRole(roleArray.slice(0, 6));
      }
    } catch (error) {
      console.error('Failed to fetch requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/users/me`);
      if (response.ok) {
        const userData = await response.json();
        setUserName(userData.full_name || userData.email?.split('@')[0] || 'User');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRequirements();
    fetchUser();
  }, []);

  // Handle Add Requirement
  const handleAddRequirement = () => {
    setShowPostRequirement(true);
  };

  // Handle Bulk Upload - Updated with token refresh and loader
  const handleBulkUpload = async () => {
    if (!bulkFile) {
      showError('Please select a CSV file');
      return;
    }

    setBulkUploading(true);

    const formData = new FormData();
    formData.append('file', bulkFile);

    try {
      let token = getToken();
      if (!token) {
        showError('Please login again');
        window.location.href = '/login';
        return;
      }

      let response = await fetch(`${API_BASE_URL}/requirements/bulk-upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      // If token expired, try to refresh
      if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          const newToken = getToken();
          response = await fetch(`${API_BASE_URL}/requirements/bulk-upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${newToken}` },
            body: formData
          });
        } else {
          showError('Session expired. Please login again.');
          window.location.href = '/login';
          return;
        }
      }

      if (response.ok) {
        const result = await response.json();
        showSuccess(`Successfully uploaded ${result.count || result.length || 0} requirements`);
        setShowBulkUpload(false);
        setBulkFile(null);
        fetchRequirements();
        fetchStats();
      } else {
        const error = await response.json();
        showError(error.detail || 'Upload failed. Please check the file format.');
      }
    } catch (error) {
      console.error('Bulk upload error:', error);
      showError('Upload failed. Please try again.');
    } finally {
      setBulkUploading(false);
    }
  };

  // Handle Download CSV Template
  const handleDownloadTemplate = () => {
    const csvContent = `role,experience_min,experience_max,positions,skills,budget_min,budget_max,duration,work_mode,start_date,location,description
DevOps Engineer,5,8,2,"AWS,Docker,Kubernetes",100000,150000,12 Months,Hybrid,Immediate,Bangalore,"Looking for experienced DevOps engineer"
Java Developer,7,10,1,"Java,Spring Boot,Microservices",120000,180000,12 Months,Remote,Immediate,Pune,"Lead Java developer"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'requirements_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showSuccess('Template downloaded successfully!');
  };

  const summaryStats = [
    { label: 'Total Requirements', value: stats.totalRequirements.toString(), trend: '+12%', trendUp: true, icon: FileText, bgColor: 'bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-600 dark:text-blue-400' },
    { label: 'Open Requirements', value: stats.openRequirements.toString(), trend: '+8%', trendUp: true, icon: Target, bgColor: 'bg-orange-50 dark:bg-orange-950/30', iconColor: 'text-orange-600 dark:text-orange-400' },
    { label: 'Closed Requirements', value: stats.closedRequirements.toString(), trend: '+4', trendUp: true, icon: Briefcase, bgColor: 'bg-green-50 dark:bg-green-950/30', iconColor: 'text-green-600 dark:text-green-400' },
    { label: 'Total Matching Profiles', value: stats.totalMatchingProfiles.toString(), trend: '+15%', trendUp: true, icon: Users, bgColor: 'bg-purple-50 dark:bg-purple-950/30', iconColor: 'text-purple-600 dark:text-purple-400' },
  ];

  const filteredRequirements = requirements.filter(req => {
    if (statusFilter === 'all') return true;
    return req.status?.toLowerCase() === statusFilter;
  });

  const maxRoleCount = Math.max(...requirementsByRole.map(r => r.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Post Requirement Dialog */}
      {showPostRequirement && (
        <PostRequirement
          onClose={() => {
            setShowPostRequirement(false);
            fetchRequirements();
            fetchStats();
          }}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-cyan-600 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">Bulk Upload Requirements</h3>
              <button
                onClick={() => {
                  if (!bulkUploading) {
                    setShowBulkUpload(false);
                    setBulkFile(null);
                  }
                }}
                className="p-1 hover:bg-white/20 rounded-lg disabled:opacity-50"
                disabled={bulkUploading}
              >
                <X size={24} className="text-white cursor-pointer" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {bulkUploading ? (
                // Uploading loader
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 size={48} className="text-primary animate-spin mb-4" />
                  <p className="text-lg font-semibold text-foreground">Uploading...</p>
                  <p className="text-sm text-muted-foreground">Please wait while we process your file</p>
                  <div className="w-full max-w-xs mt-4 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('bulk-file')?.click()}
                  >
                    <Upload size={40} className="mx-auto text-slate-400 mb-3" />
                    <p className="text-sm text-slate-600 mb-2">Click to upload CSV file</p>
                    <p className="text-xs text-slate-400">Download template for correct format</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setBulkFile(file);
                        }
                      }}
                      className="hidden"
                      id="bulk-file"
                    />
                    <label htmlFor="bulk-file" className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm cursor-pointer hover:bg-blue-700">
                      Choose File
                    </label>
                    {bulkFile && <p className="mt-2 text-sm text-green-600">Selected: {bulkFile.name}</p>}
                  </div>
                  <button onClick={handleDownloadTemplate} className="w-full py-2 text-blue-600 text-sm font-semibold hover:underline cursor-pointer">
                    Download CSV Template
                  </button>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowBulkUpload(false);
                        setBulkFile(null);
                      }}
                      className="flex-1 px-6 py-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkUpload}
                      disabled={!bulkFile}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-cyan-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Upload size={18} />
                      Upload
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Good morning, {userName} 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 text-sm sm:text-base">
          <Activity size={16} /> Here's what's happening with your requirements today
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {summaryStats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon size={20} className={`${stat.iconColor} sm:hidden`} strokeWidth={2.5} />
                <stat.icon size={28} className={`${stat.iconColor} hidden sm:block`} strokeWidth={2.5} />
              </div>
              <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{stat.trend}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">{stat.value}</div>
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Active Requirements</h2>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
              {(['all', 'open', 'closed'] as const).map((filter) => (
                <button key={filter} onClick={() => setStatusFilter(filter)} className={`px-4 py-2 text-sm font-medium cursor-pointer rounded-lg transition-all ${statusFilter === filter ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRequirements.slice(0, 6).map((req) => (
              <div key={req.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm font-bold text-blue-600 mb-1">{req.requirement_id || req.id}</div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{req.role}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${req.status === 'Open' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                    {req.status}
                  </span>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2"><Clock size={16} /> Experience</span>
                    <span className="font-medium">{req.experience_min}-{req.experience_max} yrs</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2"><DollarSign size={16} /> Budget</span>
                    <span className="font-medium">₹{req.budget_min?.toLocaleString()}-{req.budget_max?.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2"><MapPin size={16} /> Location</span>
                    <span className="font-medium">{req.location || 'Remote'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {req.skills?.slice(0, 3).map((skill: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">{skill}</span>
                  ))}
                </div>
                <button onClick={() => onViewMatches?.(req.id, req.matches_count || 0)} className="w-full py-3 bg-gradient-to-r cursor-pointer from-blue-600 to-cyan-600 hover:from-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                  View {req.matches_count || 0} Profiles <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button onClick={handleAddRequirement} className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 transition-all cursor-pointer">
                <Plus size={20} /><span className="font-semibold">Add Requirement</span>
              </button>
              <button onClick={() => setShowBulkUpload(true)} className="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-slate-100 transition-all cursor-pointer">
                <Upload size={20} /><span className="font-semibold">Bulk Upload</span>
              </button>
              <button onClick={handleDownloadTemplate} className="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-slate-100 transition-all cursor-pointer">
                <Download size={20} /><span className="font-semibold">Download Template</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border">
            <h3 className="text-lg font-bold mb-4">Requirements by Status</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Open</span>
                  <span className="text-sm font-bold">{stats.openRequirements}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${stats.totalRequirements ? (stats.openRequirements / stats.totalRequirements) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Closed</span>
                  <span className="text-sm font-bold">{stats.closedRequirements}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.totalRequirements ? (stats.closedRequirements / stats.totalRequirements) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements by Role Chart */}
      {requirementsByRole.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border">
          <h3 className="text-lg font-bold mb-6">Requirements by Role</h3>
          <div className="flex items-end justify-between gap-4 h-48">
            {requirementsByRole.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col justify-end items-center gap-3 h-full">
                <div className="w-full flex flex-col justify-end h-full">
                  <div className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-lg relative group" style={{ height: `${(data.count / maxRoleCount) * 100}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap">
                      {data.count} requirements
                    </div>
                  </div>
                </div>
                <div className="text-xs font-medium text-center">{data.role}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}