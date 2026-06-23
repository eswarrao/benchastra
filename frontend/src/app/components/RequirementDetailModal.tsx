import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
import { X, Edit2, Save, MapPin, Briefcase, DollarSign, Clock, Users, Calendar } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

// Match the ApiRequirement type from Requirements component
interface ApiRequirement {
  id: number;
  requirement_id: string;
  role: string;
  experience_min?: number;
  experience_max?: number;
  budget_min?: number;
  budget_max?: number;
  skills?: string[];
  must_have_skills?: string[];
  good_to_have_skills?: string[];
  positions?: number;
  duration?: string;
  work_mode?: string;
  start_date?: string;
  location?: string;
  description?: string;
  status: string;
  matches_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface RequirementDetailModalProps {
  requirement: ApiRequirement;
  onClose: () => void;
  mode?: 'view' | 'edit';
  onUpdate?: () => void; // Callback to refresh the list after update
}

function formatExperience(min?: number, max?: number): string {
  if (min != null && max != null) return `${min}–${max} yrs`;
  if (min != null) return `${min}+ yrs`;
  return 'N/A';
}

function formatBudget(min?: number, max?: number): string {
  if (min != null && max != null) return `₹${min.toLocaleString()}–₹${max.toLocaleString()}`;
  if (min != null) return `₹${min.toLocaleString()}+`;
  return 'N/A';
}

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

export function RequirementDetailModal({ requirement, onClose, mode = 'view', onUpdate }: RequirementDetailModalProps) {
  const { showSuccess, showError } = useToast();
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [loading, setLoading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);
  
  const [formData, setFormData] = useState({
    role: requirement.role || '',
    experience_min: requirement.experience_min || 0,
    experience_max: requirement.experience_max || 0,
    budget_min: requirement.budget_min || 0,
    budget_max: requirement.budget_max || 0,
    location: requirement.location || 'Bangalore',
    skills: requirement.skills || requirement.must_have_skills || [],
    description: requirement.description || '',
    duration: requirement.duration || '6 Months',
    work_mode: requirement.work_mode || 'Hybrid',
    positions: requirement.positions || 1,
    start_date: requirement.start_date || 'Immediate',
    status: requirement.status || 'Open',
  });

  // Fetch latest requirement details when in edit mode
  useEffect(() => {
    const fetchRequirement = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/requirements/${requirement.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setFormData({
            role: data.role || '',
            experience_min: data.experience_min || 0,
            experience_max: data.experience_max || 0,
            budget_min: data.budget_min || 0,
            budget_max: data.budget_max || 0,
            location: data.location || 'Bangalore',
            skills: data.skills || data.must_have_skills || [],
            description: data.description || '',
            duration: data.duration || '6 Months',
            work_mode: data.work_mode || 'Hybrid',
            positions: data.positions || 1,
            start_date: data.start_date || 'Immediate',
            status: data.status || 'Open',
          });
        }
      } catch (error) {
        console.error('Error fetching requirement:', error);
      }
    };

    if (isEditing) {
      fetchRequirement();
    }
  }, [requirement.id, isEditing]);

  // Update requirement
  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {
        role: formData.role,
        experience_min: formData.experience_min,
        experience_max: formData.experience_max,
        budget_min: formData.budget_min,
        budget_max: formData.budget_max,
        location: formData.location,
        skills: formData.skills,
        description: formData.description,
        duration: formData.duration,
        work_mode: formData.work_mode,
        positions: formData.positions,
        start_date: formData.start_date,
        status: formData.status,
      };

      const response = await fetchWithAuth(`${API_BASE_URL}/requirements/${requirement.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        showSuccess('Requirement updated successfully');
        setIsEditing(false);
        if (onUpdate) onUpdate();
      } else {
        const error = await response.json();
        showError(error.detail || 'Failed to update requirement');
      }
    } catch (error) {
      console.error('Error updating requirement:', error);
      showError('Error updating requirement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setFormData({ 
        ...formData, 
        skills: [...formData.skills, newSkill.trim()] 
      });
      setNewSkill('');
      setShowSkillInput(false);
    }
  };

  const handleRemoveSkill = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index),
    });
  };

  const workModes = ['Remote', 'Hybrid', 'Onsite'];
  const locations = ['Bangalore', 'Mumbai', 'Delhi', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Other'];
  const durations = ['3 Months', '6 Months', '12 Months', '24 Months'];
  const startDates = ['Immediate', '15 Days', '30 Days', '60 Days', 'Custom'];
  const statuses = ['Open', 'Closed'];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col"
        style={{ maxHeight: 'calc(100vh - 1.5rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-700 dark:to-cyan-700 px-5 sm:px-8 py-5 sm:py-6 rounded-t-2xl flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold text-white">{requirement.requirement_id}</h2>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                formData.status === 'Open'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}>
                {formData.status}
              </span>
            </div>
            <p className="text-sm text-blue-100">Requirement Details</p>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm cursor-pointer font-semibold bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                <Edit2 size={16} />
                Edit
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 text-sm cursor-pointer font-semibold bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-50 rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save Changes
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 cursor-pointer rounded-lg transition-all text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          <div className="space-y-5">
            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                <Briefcase size={16} className="text-blue-600 dark:text-blue-400" />
                Role / Position <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              ) : (
                <div className="text-base font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/30 px-4 py-2.5 rounded-xl">
                  {formData.role}
                </div>
              )}
            </div>

            {/* Experience Section */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <Clock size={16} className="inline mr-1.5 text-blue-600 dark:text-blue-400" />
                Experience Required
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={formData.experience_min}
                    onChange={(e) => setFormData({ ...formData, experience_min: parseInt(e.target.value) || 0 })}
                    placeholder="Min years"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <input
                    type="number"
                    value={formData.experience_max}
                    onChange={(e) => setFormData({ ...formData, experience_max: parseInt(e.target.value) || 0 })}
                    placeholder="Max years"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              ) : (
                <div className="text-base text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/30 px-4 py-2.5 rounded-xl">
                  {formatExperience(formData.experience_min, formData.experience_max)}
                </div>
              )}
            </div>

            {/* Budget Section */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                <DollarSign size={16} className="text-blue-600 dark:text-blue-400" />
                Budget Range (₹)
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={formData.budget_min}
                    onChange={(e) => setFormData({ ...formData, budget_min: parseInt(e.target.value) || 0 })}
                    placeholder="Min budget"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <input
                    type="number"
                    value={formData.budget_max}
                    onChange={(e) => setFormData({ ...formData, budget_max: parseInt(e.target.value) || 0 })}
                    placeholder="Max budget"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              ) : (
                <div className="text-base text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/30 px-4 py-2.5 rounded-xl">
                  {formatBudget(formData.budget_min, formData.budget_max)}
                </div>
              )}
            </div>

            {/* Positions & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Users size={16} className="inline mr-1.5 text-blue-600 dark:text-blue-400" />
                  Positions
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.positions}
                    onChange={(e) => setFormData({ ...formData, positions: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                ) : (
                  <div className="text-base text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/30 px-4 py-2.5 rounded-xl">
                    {formData.positions} position{formData.positions !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Clock size={16} className="inline mr-1.5 text-blue-600 dark:text-blue-400" />
                  Duration
                </label>
                {isEditing ? (
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {durations.map(dur => (
                      <option key={dur} value={dur}>{dur}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-base text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/30 px-4 py-2.5 rounded-xl">
                    {formData.duration || 'Not specified'}
                  </div>
                )}
              </div>
            </div>

            {/* Work Mode & Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Briefcase size={16} className="inline mr-1.5 text-blue-600 dark:text-blue-400" />
                  Work Mode
                </label>
                {isEditing ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {workModes.map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFormData({ ...formData, work_mode: mode })}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border-2 transition-all ${
                          formData.work_mode === mode
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-blue-500'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-base text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/30 px-4 py-2.5 rounded-xl">
                    {formData.work_mode || 'Not specified'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                  <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                  Location
                </label>
                {isEditing ? (
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-base text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/30 px-4 py-2.5 rounded-xl">
                    {formData.location || 'Not specified'}
                  </div>
                )}
              </div>
            </div>

            {/* Start Date & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <Calendar size={16} className="inline mr-1.5 text-blue-600 dark:text-blue-400" />
                  Start Date
                </label>
                {isEditing ? (
                  <select
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {startDates.map(date => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-base text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/30 px-4 py-2.5 rounded-xl">
                    {formData.start_date || 'Not specified'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                {isEditing ? (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                ) : (
                  <div className={`text-base font-medium px-4 py-2.5 rounded-xl ${
                    formData.status === 'Open'
                      ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-50 dark:bg-gray-800/30 text-gray-700 dark:text-gray-400'
                  }`}>
                    {formData.status}
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Required Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-sm font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800 inline-flex items-center gap-1.5"
                  >
                    {skill}
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveSkill(index)}
                        className="hover:text-red-500 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </span>
                ))}
                {isEditing && (
                  <div className="inline-flex items-center gap-1.5">
                    {showSkillInput ? (
                      <>
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Enter skill"
                          className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkill();
                            }
                          }}
                        />
                        <button
                          onClick={handleAddSkill}
                          className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowSkillInput(false);
                            setNewSkill('');
                          }}
                          className="px-3 py-1.5 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setShowSkillInput(true)}
                        className="px-3 py-1.5 text-sm font-medium border-2 border-dashed border-blue-400 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all cursor-pointer"
                      >
                        + Add Skill
                      </button>
                    )}
                  </div>
                )}
                {!isEditing && formData.skills.length === 0 && (
                  <span className="text-sm text-slate-400">No skills listed</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Job Description
              </label>
              {isEditing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Enter job description..."
                />
              ) : (
                <div className="text-base text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-700/30 px-4 py-2.5 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {formData.description || 'No description provided'}
                </div>
              )}
            </div>

            {/* Matching Profiles */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Matching Profiles</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Profiles that match this requirement</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{requirement.matches_count || 0}</div>
                  <button 
                    onClick={() => {
                      // Navigate to matches view
                      onClose();
                      // The parent component will handle navigation
                    }}
                    className="text-sm cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
                  >
                    View All →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}