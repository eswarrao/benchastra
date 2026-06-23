import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
import { Users, Briefcase, FileCheck, DollarSign, TrendingUp } from 'lucide-react';

interface VendorDashboardProps {
  onNavigate?: (page: 'dashboard' | 'resources' | 'contracts') => void;
}

export function VendorDashboard({ onNavigate }: VendorDashboardProps) {
  const [trendFilter, setTrendFilter] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [stats, setStats] = useState({
    active_resources: 0,
    fulfilled_jobs: 0,
    active_contracts: 0,
    monthly_revenue: 0
  });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorName, setVendorName] = useState('Vendor');

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

  useEffect(() => {
    const fetchStats = async () => {
      const token = getToken();
      if (!token) return;
      
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/dashboard/vendor/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    const fetchTrends = async () => {
      const token = getToken();
      if (!token) return;
      
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/analytics/vendor/availability-trend`);
        if (response.ok) {
          const trends = await response.json();
          setTrendData(trends[trendFilter] || []);
        }
      } catch (error) {
        console.error('Error fetching trends:', error);
        // Fallback data
        setTrendData([
          { label: 'Mon', value: 85 }, { label: 'Tue', value: 70 }, { label: 'Wed', value: 90 },
          { label: 'Thu', value: 75 }, { label: 'Fri', value: 95 }, { label: 'Sat', value: 60 }, { label: 'Sun', value: 50 }
        ]);
      }
    };

    const fetchUser = async () => {
      const token = getToken();
      if (!token) return;
      
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/users/me`);
        if (response.ok) {
          const userData = await response.json();
          setVendorName(userData.vendor_name || userData.full_name || userData.email?.split('@')[0] || 'Vendor');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchTrends();
    fetchUser();
  }, [trendFilter]);

  const statsArray = [
    { label: 'Active Resources', value: stats.active_resources, icon: Users, bgColor: 'bg-green-50 dark:bg-green-950/30', iconColor: 'text-green-600 dark:text-green-400' },
    { label: 'Fulfilled Jobs', value: stats.fulfilled_jobs, icon: FileCheck, bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Active Contracts', value: stats.active_contracts, icon: Briefcase, bgColor: 'bg-teal-50 dark:bg-teal-950/30', iconColor: 'text-teal-600 dark:text-teal-400' },
    { label: 'Monthly Revenue', value: `₹${(stats.monthly_revenue / 1000).toFixed(1)}L`, icon: DollarSign, bgColor: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-600 dark:text-amber-400' },
  ];

  const currentData = trendData;
  const maxValue = Math.max(...currentData.map((d: any) => d.value), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Welcome back, {vendorName}! 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Let's review today's business overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {statsArray.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon size={20} className={`${stat.iconColor} sm:hidden`} strokeWidth={2.5} />
                <stat.icon size={28} className={`${stat.iconColor} hidden sm:block`} strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-xs sm:text-sm font-medium"><TrendingUp size={14} /><span>+12%</span></div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
              <div className="text-xs sm:text-sm text-slate-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Resource Availability Trend</h2>
            <p className="text-sm text-slate-500 mt-1">{trendFilter.charAt(0).toUpperCase() + trendFilter.slice(1)} resource utilization overview</p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 rounded-xl p-1 self-start flex-shrink-0">
            {(['weekly', 'monthly', 'yearly'] as const).map((filter) => (
              <button 
                key={filter} 
                onClick={() => setTrendFilter(filter)} 
                className={`px-2.5 cursor-pointer sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  trendFilter === filter 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 h-64">
          {currentData.map((data: any, index: number) => {
            const heightPercentage = (data.value / maxValue) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col justify-end items-center gap-3 h-full">
                <div className="w-full flex flex-col justify-end h-full">
                  <div className="w-full bg-gradient-to-t from-green-600 to-emerald-400 rounded-t-lg relative group" style={{ height: `${heightPercentage}%` }}>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap">{data.value}%</div>
                  </div>
                </div>
                <div className="text-xs font-medium text-center truncate w-full">{data.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border">
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate?.('resources')}
              className="w-full cursor-pointer flex items-center gap-4 p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-600/30"
            >
              <Users size={20} /><span className="font-semibold">Add New Resource</span>
            </button>
            <button
              onClick={() => onNavigate?.('contracts')}
              className="w-full cursor-pointer flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-all text-slate-700 dark:text-slate-200"
            >
              <Briefcase size={20} /><span className="font-semibold">View Active Contracts</span>
            </button>
            <button
              onClick={() => onNavigate?.('resources')}
              className="w-full cursor-pointer flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition-all text-slate-700 dark:text-slate-200"
            >
              <FileCheck size={20} /><span className="font-semibold">Manage Resources</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border">
          <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {stats.active_resources > 0 && (
              <div className="flex items-start gap-3 pb-4 border-b">
                <div className="w-2 h-2 rounded-full mt-2 bg-green-500"></div>
                <div>
                  <div className="text-sm font-medium">Resources Available</div>
                  <div className="text-sm text-slate-500">{stats.active_resources} resources ready for deployment</div>
                </div>
                <div className="text-xs text-slate-400 ml-auto">Now</div>
              </div>
            )}
            {stats.active_contracts > 0 && (
              <div className="flex items-start gap-3 pb-4 border-b">
                <div className="w-2 h-2 rounded-full mt-2 bg-teal-500"></div>
                <div>
                  <div className="text-sm font-medium">Active Contracts</div>
                  <div className="text-sm text-slate-500">{stats.active_contracts} contracts in progress</div>
                </div>
                <div className="text-xs text-slate-400 ml-auto">Active</div>
              </div>
            )}
            {stats.fulfilled_jobs > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-2 bg-emerald-500"></div>
                <div>
                  <div className="text-sm font-medium">Jobs Fulfilled</div>
                  <div className="text-sm text-slate-500">{stats.fulfilled_jobs} successful placements</div>
                </div>
                <div className="text-xs text-slate-400 ml-auto">Total</div>
              </div>
            )}
            {stats.active_resources === 0 && stats.active_contracts === 0 && stats.fulfilled_jobs === 0 && (
              <div className="text-sm text-slate-500 text-center py-4">No recent activity to display</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}