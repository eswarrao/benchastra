import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
import { Search, Download, Plus, Eye, Edit2, Trash2, X, Upload, Loader2, CheckSquare, Square, Trash, FileSpreadsheet } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import * as XLSX from 'xlsx';

interface Resource {
  id: string;
  resource_id: string;
  name: string;
  skill_domain: string;
  experience: string;
  experience_years: number;
  availability: string;
  availability_days: number;
  base_rate: number;
  location: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  status: 'Available' | 'Busy' | 'On Leave';
  resume_url?: string;
}

interface FormErrors {
  name?: string;
  skill_domain?: string;
  experience?: string;
  availability?: string;
  base_rate?: string;
  location?: string;
  email?: string;
  phone?: string;
  skills?: string;
}

const ITEMS_PER_PAGE = 10;

export function VendorResources() {
  const { showSuccess, showError } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<FormErrors>({});

  // Form states for add/edit
  const [resourceName, setResourceName] = useState('');
  const [skillDomain, setSkillDomain] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [baseRate, setBaseRate] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [summary, setSummary] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeDataUrl, setResumeDataUrl] = useState<string>('');
  const [resumeLoading, setResumeLoading] = useState(false);

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

  // Fetch resources
  const fetchResources = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/resources/`);
      if (response.ok) {
        const data = await response.json();
        const mappedResources = data.map((resource: any) => ({
          id: resource.id,
          resource_id: resource.resource_id,
          name: resource.name,
          skill_domain: resource.skill_domain || resource.skillDomain,
          experience: resource.experience || `${resource.experience_years || 0} yrs`,
          experience_years: resource.experience_years || 0,
          availability: resource.availability || 'Available',
          availability_days: resource.availability_days || 0,
          base_rate: resource.base_rate || 0,
          location: resource.location || 'Not specified',
          email: resource.email || '',
          phone: resource.phone || '',
          summary: resource.summary || '',
          skills: resource.skills || [],
          status: resource.status || 'Available',
          resume_url: resource.resume_url || ''
        }));
        setResources(mappedResources);
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      showError('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Filter resources based on search query
  const filteredResources = resources.filter((resource) =>
    resource.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.skill_domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!resourceName.trim()) {
      newErrors.name = 'Resource name is required';
      isValid = false;
    }

    if (!skillDomain.trim()) {
      newErrors.skill_domain = 'Skill domain is required';
      isValid = false;
    }

    if (!experience || parseInt(experience) < 0) {
      newErrors.experience = 'Please enter a valid experience';
      isValid = false;
    }

    if (!availability) {
      newErrors.availability = 'Availability is required';
      isValid = false;
    }

    if (!baseRate || parseFloat(baseRate) <= 0) {
      newErrors.base_rate = 'Please enter a valid base rate';
      isValid = false;
    }

    if (!location.trim()) {
      newErrors.location = 'Location is required';
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    // Phone validation - exactly 10 digits or 10 digits with +91 prefix
    if (phone) {
      const cleanPhone = phone.replace(/\s/g, '');
      const phonePattern = /^(\+91)?[6-9]\d{9}$/;
      if (!phonePattern.test(cleanPhone)) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Add skill
  const handleAddSkill = () => {
    if (skillInput.trim() && !selectedSkills.includes(skillInput.trim())) {
      setSelectedSkills([...selectedSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  // Remove skill
  const handleRemoveSkill = (skillToRemove: string) => {
    setSelectedSkills(selectedSkills.filter(skill => skill !== skillToRemove));
  };

  // Handle skill input keypress
  const handleSkillKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // Add resource
  const handleAddResource = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/resources/`, {
        method: 'POST',
        body: JSON.stringify({
          name: resourceName,
          skill_domain: skillDomain,
          experience: experience,
          experience_years: parseInt(experience) || 0,
          availability: availability,
          base_rate: parseFloat(baseRate) || 0,
          location: location,
          email: email,
          phone: phone,
          summary: summary,
          skills: selectedSkills,
          resume_url: resumeDataUrl || null,
          status: 'Available'
        }),
      });

      if (response.ok) {
        showSuccess('Resource added successfully!');
        setShowAddModal(false);
        resetForm();
        fetchResources();
      } else {
        const error = await response.json();
        showError(error.detail || 'Failed to add resource');
      }
    } catch (error) {
      console.error('Error adding resource:', error);
      showError('Failed to add resource');
    }
  };

  // Update resource
  const handleUpdateResource = async () => {
    if (!editingResource || !validateForm()) return;

    try {
      // Extract numeric experience value
      const experienceYears = parseInt(experience) || 0;
      
      const updateData = {
        name: resourceName,
        skill_domain: skillDomain,
        experience: `${experienceYears} yrs`,
        experience_years: experienceYears,
        availability: availability,
        base_rate: parseFloat(baseRate) || 0,
        location: location,
        email: email || '',
        phone: phone || '',
        summary: summary || '',
        skills: selectedSkills,
        resume_url: resumeDataUrl || editingResource.resume_url || null,
      };

      const response = await fetchWithAuth(`${API_BASE_URL}/resources/${editingResource.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        showSuccess('Resource updated successfully!');
        setShowEditModal(false);
        setEditingResource(null);
        resetForm();
        fetchResources();
      } else {
        const error = await response.json();
        showError(error.detail || 'Failed to update resource');
      }
    } catch (error) {
      console.error('Error updating resource:', error);
      showError('Failed to update resource');
    }
  };

  // Delete resource
  const handleDeleteResource = async () => {
    if (!selectedResource) return;

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/resources/${selectedResource.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showSuccess('Resource deleted successfully!');
        setShowDeleteModal(false);
        setSelectedResource(null);
        fetchResources();
      } else {
        showError('Failed to delete resource');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      showError('Failed to delete resource');
    }
  };

  // Bulk delete selected resources
  const handleBulkDelete = async () => {
    try {
      const ids = Array.from(selectedIds);
      const promises = ids.map(id =>
        fetchWithAuth(`${API_BASE_URL}/resources/${id}`, {
          method: 'DELETE',
        })
      );

      await Promise.all(promises);
      showSuccess(`Successfully deleted ${ids.length} resources`);
      setShowBulkDeleteModal(false);
      setSelectedIds(new Set());
      fetchResources();
    } catch (error) {
      console.error('Error deleting resources:', error);
      showError('Failed to delete some resources');
    }
  };

  // Download roster as Excel
  const handleDownloadRoster = () => {
    try {
      const data = filteredResources.map((resource, index) => ({
        'S.No': index + 1,
        'Resource ID': resource.resource_id || resource.id,
        'Name': resource.name,
        'Skill Domain': resource.skill_domain,
        'Experience': resource.experience,
        'Availability': resource.availability,
        'Base Rate (₹/mo)': resource.base_rate,
        'Location': resource.location,
        'Email': resource.email,
        'Phone': resource.phone,
        'Skills': resource.skills?.join(', ') || '',
        'Status': resource.status,
        'Summary': resource.summary || ''
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Resources');

      const colWidths = [
        { wch: 6 }, { wch: 12 }, { wch: 20 }, { wch: 20 },
        { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 15 },
        { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 40 }
      ];
      ws['!cols'] = colWidths;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resources_roster_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showSuccess('Roster downloaded successfully!');
    } catch (error) {
      console.error('Error downloading roster:', error);
      showError('Failed to download roster');
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showError('File too large. Maximum 5MB allowed.');
      return;
    }
    setResumeFile(file);
    setResumeLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      // Append filename to data URL so we can recover it later
      setResumeDataUrl(result + `;;filename=${file.name}`);
      setResumeLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setResourceName('');
    setSkillDomain('');
    setExperience('');
    setAvailability('');
    setBaseRate('');
    setLocation('');
    setEmail('');
    setPhone('');
    setSummary('');
    setSelectedSkills([]);
    setSkillInput('');
    setResumeFile(null);
    setResumeDataUrl('');
    setErrors({});
  };

  const handleViewDetails = (resource: Resource) => {
    setSelectedResource(resource);
    setShowDetailsModal(true);
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setResourceName(resource.name);
    setSkillDomain(resource.skill_domain);
    // Extract just the number from experience string (e.g., "5 yrs" -> "5")
    const expNum = resource.experience?.match(/\d+/);
    setExperience(expNum ? expNum[0] : resource.experience_years?.toString() || '0');
    setAvailability(resource.availability);
    setBaseRate(resource.base_rate.toString());
    setLocation(resource.location);
    setEmail(resource.email);
    setPhone(resource.phone);
    setSummary(resource.summary);
    setSelectedSkills(resource.skills || []);
    setSkillInput('');
    setResumeFile(null);
    setResumeDataUrl((resource as any).resume_url || '');
    setErrors({});
    setShowEditModal(true);
  };

  const handleDelete = (resource: Resource) => {
    setSelectedResource(resource);
    setShowDeleteModal(true);
  };

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredResources.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(filteredResources.map(r => r.id));
      setSelectedIds(allIds);
    }
  };

  const isAllSelected = filteredResources.length > 0 && selectedIds.size === filteredResources.length;

  const totalPages = Math.max(1, Math.ceil(filteredResources.length / ITEMS_PER_PAGE));
  const paginatedResources = filteredResources.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Resources</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Manage all bench resources</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex cursor-pointer items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-600/30 self-start sm:self-auto text-sm sm:text-base"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add Resource</span>
        </button>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Search by name, skill, location..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {selectedIds.size > 0 && (
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all text-sm flex-shrink-0"
              >
                <Trash size={18} />
                Delete ({selectedIds.size})
              </button>
            )}
            <button
              onClick={handleDownloadRoster}
              className="flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all text-sm flex-shrink-0"
            >
              <FileSpreadsheet size={18} />
              <span>Download Roster</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resources Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {filteredResources.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
            {searchQuery ? `No resources found matching "${searchQuery}"` : 'No resources found. Add your first resource!'}
          </div>
        )}

        {paginatedResources.length > 0 && (
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
            {paginatedResources.map((resource) => (
              <div key={resource.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSelect(resource.id)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      {selectedIds.has(resource.id) ? (
                        <CheckSquare size={18} className="text-green-600" />
                      ) : (
                        <Square size={18} className="text-slate-400" />
                      )}
                    </button>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{resource.name}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">{resource.resource_id || resource.id}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                    resource.status === 'Available' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                    resource.status === 'Busy' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' :
                    'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                  }`}>{resource.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-slate-600 dark:text-slate-300 mb-3">
                  <span>{resource.skill_domain}</span>
                  <span>{resource.experience} exp</span>
                  <span>{resource.location}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">₹{resource.base_rate?.toLocaleString()}/mo</span>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => handleViewDetails(resource)} className="p-1.5 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"><Eye size={16} /></button>
                  <button onClick={() => handleEdit(resource)} className="p-1.5 cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/30 text-green-600 dark:text-green-400 rounded-lg transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(resource)} className="p-1.5 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {paginatedResources.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      {isAllSelected ? (
                        <CheckSquare size={18} className="text-green-600" />
                      ) : (
                        <Square size={18} className="text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Skill Domain</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Exp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Availability</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Rate/mo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {paginatedResources.map((resource, index) => (
                  <tr key={resource.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSelect(resource.id)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                      >
                        {selectedIds.has(resource.id) ? (
                          <CheckSquare size={18} className="text-green-600" />
                        ) : (
                          <Square size={18} className="text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm text-slate-800 dark:text-slate-100">{resource.name}</div>
                      <div className="text-xs text-green-600 dark:text-green-400">{resource.resource_id || resource.id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{resource.skill_domain}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{resource.experience}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{resource.availability}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{resource.location}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">₹{resource.base_rate?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        resource.status === 'Available' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                        resource.status === 'Busy' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' :
                        'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                      }`}>{resource.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleViewDetails(resource)} className="p-1.5 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors" title="View"><Eye size={16} strokeWidth={2.5} /></button>
                        <button onClick={() => handleEdit(resource)} className="p-1.5 cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/30 text-green-600 dark:text-green-400 rounded-lg transition-colors" title="Edit"><Edit2 size={16} strokeWidth={2.5} /></button>
                        <button onClick={() => handleDelete(resource)} className="p-1.5 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg transition-colors" title="Delete"><Trash2 size={16} strokeWidth={2.5} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredResources.length > 0 && (
          <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredResources.length)} of {filteredResources.length}
            </div>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 cursor-pointer text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >Previous</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 cursor-pointer text-sm rounded-lg font-semibold transition-colors ${pageNum === currentPage ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 cursor-pointer text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-green-600 to-emerald-600 sticky top-0">
              <h3 className="text-xl font-bold text-white">Add Resource</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 cursor-pointer hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Resource Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Enter resource name"
                  value={resourceName}
                  onChange={(e) => {
                    setResourceName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Skill Domain <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Full Stack Developer"
                  value={skillDomain}
                  onChange={(e) => {
                    setSkillDomain(e.target.value);
                    if (errors.skill_domain) setErrors({ ...errors, skill_domain: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.skill_domain ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.skill_domain && <p className="text-xs text-red-500 mt-1">{errors.skill_domain}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Experience (years) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  placeholder="e.g., 5"
                  value={experience}
                  onChange={(e) => {
                    setExperience(e.target.value);
                    if (errors.experience) setErrors({ ...errors, experience: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.experience ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.experience && <p className="text-xs text-red-500 mt-1">{errors.experience}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Availability <span className="text-red-500">*</span></label>
                <select
                  value={availability}
                  onChange={(e) => {
                    setAvailability(e.target.value);
                    if (errors.availability) setErrors({ ...errors, availability: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.availability ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                >
                  <option value="">Select availability</option>
                  <option value="Immediate">Immediate</option>
                  <option value="15 days">15 days</option>
                  <option value="30 days">30 days</option>
                  <option value="60+ days">60+ days</option>
                </select>
                {errors.availability && <p className="text-xs text-red-500 mt-1">{errors.availability}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Base Rate (₹/mo) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  placeholder="e.g., 120000"
                  value={baseRate}
                  onChange={(e) => {
                    setBaseRate(e.target.value);
                    if (errors.base_rate) setErrors({ ...errors, base_rate: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.base_rate ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.base_rate && <p className="text-xs text-red-500 mt-1">{errors.base_rate}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Location <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Bangalore"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (errors.location) setErrors({ ...errors, location: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.location ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Phone <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Enter 10-digit phone number"
                  value={phone}
                  onChange={(e) => {
                    // Only allow digits and + sign
                    const value = e.target.value.replace(/[^+\d]/g, '');
                    setPhone(value);
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                  maxLength={13} // +91 + 10 digits = 13 chars
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.phone ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                <p className="text-xs text-slate-500 mt-1">Enter 10-digit number (e.g., 9876543210) or with +91 prefix</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Skills</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., AWS, Docker, Kubernetes"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={handleSkillKeyPress}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Summary</label>
                <textarea
                  placeholder="Enter summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Resume <span className="text-slate-400 font-normal text-xs">(PDF or DOC, max 5MB)</span></label>
                <label className="flex items-center gap-3 w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-500 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group">
                  <Upload size={18} className="text-slate-400 group-hover:text-green-600 flex-shrink-0" />
                  <span className="text-sm text-slate-500 dark:text-slate-300 truncate">
                    {resumeLoading ? 'Reading file...' : resumeFile ? resumeFile.name : 'Click to upload resume'}
                  </span>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeChange} />
                </label>
                {resumeFile && !resumeLoading && (
                  <div className="flex items-center justify-between mt-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-xs text-green-700 dark:text-green-400 truncate">{resumeFile.name}</span>
                    <button onClick={() => { setResumeFile(null); setResumeDataUrl(''); }} className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"><X size={14} /></button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleAddResource} disabled={resumeLoading} className="flex-1 cursor-pointer px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-lg shadow-green-600/30 hover:from-green-700 hover:to-green-800 transition-colors disabled:opacity-60">Add Resource</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Details Modal */}
      {showDetailsModal && selectedResource && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">Resource Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 cursor-pointer hover:bg-white/20 rounded-lg"><X size={24} className="text-white" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-xs text-slate-500 mb-1">Resource Name</div><div className="text-sm font-semibold">{selectedResource.name}</div></div>
                <div><div className="text-xs text-slate-500 mb-1">Skill Domain</div><div className="text-sm font-semibold">{selectedResource.skill_domain}</div></div>
                <div><div className="text-xs text-slate-500 mb-1">Experience</div><div className="text-sm font-semibold">{selectedResource.experience}</div></div>
                <div><div className="text-xs text-slate-500 mb-1">Base Rate</div><div className="text-sm font-semibold text-green-600">₹{selectedResource.base_rate?.toLocaleString()}/mo</div></div>
                <div><div className="text-xs text-slate-500 mb-1">Availability</div><div className="text-sm font-semibold">{selectedResource.availability}</div></div>
                <div><div className="text-xs text-slate-500 mb-1">Location</div><div className="text-sm font-semibold">{selectedResource.location}</div></div>
              </div>
              <div><div className="text-xs text-slate-500 mb-2">Skills</div><div className="flex flex-wrap gap-2">{selectedResource.skills?.map((skill, i) => (<span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{skill}</span>))}</div></div>
              <div><div className="text-xs text-slate-500 mb-2">Summary</div><p className="text-sm text-slate-600">{selectedResource.summary || 'No summary provided'}</p></div>
              <div><div className="text-xs text-slate-500 mb-1">Status</div><div className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${selectedResource.status === 'Available' ? 'bg-green-100 text-green-700' : selectedResource.status === 'Busy' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{selectedResource.status}</div></div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Resume</div>
                {selectedResource.resume_url ? (
                  <a
                    href={selectedResource.resume_url.split(';;')[0]}
                    download={selectedResource.resume_url.split(';;filename=')[1] || 'resume'}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download size={14} /> Download Resume
                  </a>
                ) : (
                  <span className="text-sm text-slate-400 italic">Resume not attached</span>
                )}
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="w-full cursor-pointer px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {showEditModal && editingResource && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-600 to-emerald-600 sticky top-0">
              <h3 className="text-xl font-bold text-white">Edit Resource</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 cursor-pointer hover:bg-white/20 rounded-lg"><X size={24} className="text-white" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Resource Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={resourceName}
                  onChange={(e) => {
                    setResourceName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Skill Domain <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={skillDomain}
                  onChange={(e) => {
                    setSkillDomain(e.target.value);
                    if (errors.skill_domain) setErrors({ ...errors, skill_domain: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.skill_domain ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.skill_domain && <p className="text-xs text-red-500 mt-1">{errors.skill_domain}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Experience (years) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={experience}
                  onChange={(e) => {
                    setExperience(e.target.value);
                    if (errors.experience) setErrors({ ...errors, experience: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.experience ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.experience && <p className="text-xs text-red-500 mt-1">{errors.experience}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Availability <span className="text-red-500">*</span></label>
                <select
                  value={availability}
                  onChange={(e) => {
                    setAvailability(e.target.value);
                    if (errors.availability) setErrors({ ...errors, availability: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.availability ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                >
                  <option value="Immediate">Immediate</option>
                  <option value="15 days">15 days</option>
                  <option value="30 days">30 days</option>
                  <option value="60+ days">60+ days</option>
                </select>
                {errors.availability && <p className="text-xs text-red-500 mt-1">{errors.availability}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Base Rate (₹/mo) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={baseRate}
                  onChange={(e) => {
                    setBaseRate(e.target.value);
                    if (errors.base_rate) setErrors({ ...errors, base_rate: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.base_rate ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.base_rate && <p className="text-xs text-red-500 mt-1">{errors.base_rate}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Location <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (errors.location) setErrors({ ...errors, location: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.location ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Phone <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Enter 10-digit phone number"
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^+\d]/g, '');
                    setPhone(value);
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                  maxLength={13}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${errors.phone ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Skills</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add skill and press Enter"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={handleSkillKeyPress}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Summary</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Resume <span className="text-slate-400 font-normal text-xs">(PDF or DOC, max 5MB)</span></label>
                {resumeDataUrl && !resumeFile && (
                  <div className="flex items-center justify-between mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                    <span className="text-xs text-blue-700 dark:text-blue-400">Current resume uploaded</span>
                    <div className="flex items-center gap-2">
                      <a href={resumeDataUrl.split(';;')[0]} download={resumeDataUrl.split(';;filename=')[1] || 'resume'} className="text-xs text-blue-600 hover:underline">Download</a>
                      <button onClick={() => setResumeDataUrl('')} className="text-red-500 hover:text-red-700"><X size={14} /></button>
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-3 w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-500 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group">
                  <Upload size={18} className="text-slate-400 group-hover:text-green-600 flex-shrink-0" />
                  <span className="text-sm text-slate-500 dark:text-slate-300 truncate">
                    {resumeLoading ? 'Reading file...' : resumeFile ? resumeFile.name : 'Click to replace resume'}
                  </span>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeChange} />
                </label>
                {resumeFile && !resumeLoading && (
                  <div className="flex items-center justify-between mt-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-xs text-green-700 dark:text-green-400 truncate">{resumeFile.name}</span>
                    <button onClick={() => { setResumeFile(null); setResumeDataUrl(editingResource?.resume_url || ''); }} className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"><X size={14} /></button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowEditModal(false)} className="flex-1 cursor-pointer px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleUpdateResource} disabled={resumeLoading} className="flex-1 cursor-pointer px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg shadow-green-600/30 hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-60">Update Resource</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedResource && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} className="text-red-600" /></div>
              <h3 className="text-2xl font-bold mb-2">Delete Resource</h3>
              <p className="text-slate-600 mb-6">Are you sure you want to delete <br /><span className="font-semibold">{selectedResource.name}</span>?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 cursor-pointer px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleDeleteResource} className="flex-1 cursor-pointer px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBulkDeleteModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} className="text-red-600" /></div>
              <h3 className="text-2xl font-bold mb-2">Delete Selected Resources</h3>
              <p className="text-slate-600 mb-6">Are you sure you want to delete <br /><span className="font-semibold">{selectedIds.size} resource(s)</span>? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowBulkDeleteModal(false)} className="flex-1 cursor-pointer px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleBulkDelete} className="flex-1 cursor-pointer px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors">Delete All</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}