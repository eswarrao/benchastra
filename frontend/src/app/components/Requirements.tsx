import { useState, useEffect, useMemo } from 'react';
import { Eye, Edit2, Trash2, Download, Upload, Plus, Search, CheckSquare, Square, Trash, Loader2 } from 'lucide-react';
import { RequirementDetailModal } from './RequirementDetailModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { Pagination } from './Pagination';
import { useToast } from '../contexts/ToastContext';

interface RequirementsProps {
  onViewMatches?: (jobId: string, matchCount: number) => void;
  onCreateNew?: () => void;
}

// Shape returned by GET /requirements/
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
    
    // Don't set Content-Type for FormData
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

export function Requirements({ onViewMatches, onCreateNew }: RequirementsProps) {
  const { showSuccess, showError } = useToast();
  const [selectedRequirement, setSelectedRequirement] = useState<ApiRequirement | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; id: number; label: string }>({
    show: false,
    id: 0,
    label: '',
  });
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState<{ show: boolean; count: number }>({
    show: false,
    count: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [requirements, setRequirements] = useState<ApiRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const itemsPerPage = 10;

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetchWithAuth(`/api/requirements/?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setRequirements(Array.isArray(data) ? data : []);
        // Clear selections when data changes
        setSelectedIds(new Set());
      } else {
        console.error('Failed to fetch requirements:', response.status);
        setRequirements([]);
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [statusFilter]);

  // Handle view matches - Use the numeric ID from the requirement
  const handleViewMatches = async (requirement: ApiRequirement) => {
    try {
      // Use the numeric ID (database ID) for the matches endpoint
      const endpoint = `/api/requirements/${requirement.id}/matches`;
      
      const response = await fetchWithAuth(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        // Pass the requirement_id (string) and match count to the parent
        onViewMatches?.(requirement.requirement_id, data.length || requirement.matches_count || 0);
      } else if (response.status === 404) {
        // No matches found
        onViewMatches?.(requirement.requirement_id, 0);
        showError('No matches found for this requirement.');
      } else {
        // Fallback: use the stored matches count
        onViewMatches?.(requirement.requirement_id, requirement.matches_count || 0);
        showError('Could not fetch matches. Showing cached count.');
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      onViewMatches?.(requirement.requirement_id, requirement.matches_count || 0);
    }
  };

  const confirmDelete = async () => {
    try {
      await fetchWithAuth(`/api/requirements/${deleteConfirmation.id}`, {
        method: 'DELETE',
      });
      setDeleteConfirmation({ show: false, id: 0, label: '' });
      fetchRequirements();
      showSuccess('Requirement deleted successfully');
    } catch (error) {
      console.error('Error deleting requirement:', error);
      showError('Failed to delete requirement');
    }
  };

  // Bulk delete selected requirements
  const confirmBulkDelete = async () => {
    try {
      const ids = Array.from(selectedIds);
      const promises = ids.map(id => 
        fetchWithAuth(`/api/requirements/${id}`, {
          method: 'DELETE',
        })
      );
      
      await Promise.all(promises);
      setBulkDeleteConfirmation({ show: false, count: 0 });
      setSelectedIds(new Set());
      fetchRequirements();
      showSuccess(`Successfully deleted ${ids.length} requirements`);
    } catch (error) {
      console.error('Error deleting requirements:', error);
      showError('Failed to delete some requirements');
    }
  };

  const handleView = (req: ApiRequirement) => {
    setSelectedRequirement(req);
    setModalMode('view');
  };

  const handleEdit = (req: ApiRequirement) => {
    setSelectedRequirement(req);
    setModalMode('edit');
  };

  const handleDelete = (req: ApiRequirement) => {
    setDeleteConfirmation({ show: true, id: req.id, label: req.requirement_id });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, id: 0, label: '' });
  };

  const cancelBulkDelete = () => {
    setBulkDeleteConfirmation({ show: false, count: 0 });
  };

  // Filtered requirements - defined once with useMemo
  const filteredRequirements = useMemo(() => {
    return requirements.filter((req) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (req.requirement_id || '').toLowerCase().includes(q) ||
        (req.role || '').toLowerCase().includes(q)
      );
    });
  }, [requirements, searchQuery]);

  // Selection handlers
  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRequirements.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(filteredRequirements.map(r => r.id));
      setSelectedIds(allIds);
    }
  };

  const isAllSelected = filteredRequirements.length > 0 && selectedIds.size === filteredRequirements.length;

  // BULK UPLOAD FUNCTIONS
  const handleBulkUpload = async (file: File) => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (!token) {
      showError('Please login first');
      return;
    }

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showError('Please upload an Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      let response = await fetch('/api/requirements/bulk-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          const newToken = localStorage.getItem('token') || localStorage.getItem('access_token');
          response = await fetch('/api/requirements/bulk-upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newToken}`,
            },
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
        const count = result.count || result.length || result.uploaded_count || 0;
        showSuccess(`Successfully uploaded ${count} requirements`);
        fetchRequirements();
      } else {
        const error = await response.json();
        showError(error.detail || 'Failed to upload file. Please check the format.');
        console.error('Upload error:', error);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showError('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileUpload = () => {
    // Prevent multiple clicks
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleBulkUpload(file);
      }
      // Reset the input
      (e.target as HTMLInputElement).value = '';
    };
    // Use a click handler that prevents duplicate triggers
    input.click();
  };

  // Download CSV Template with correct field names
  const handleDownloadTemplate = () => {
    const headers = [
      'role',
      'experience_min',
      'experience_max',
      'positions',
      'skills',
      'budget_min',
      'budget_max',
      'duration',
      'work_mode',
      'start_date',
      'location',
      'description'
    ];
    
    const sampleData = [
      'DevOps Engineer',
      '5',
      '8',
      '2',
      'AWS,Docker,Kubernetes',
      '100000',
      '150000',
      '12 Months',
      'Hybrid',
      'Immediate',
      'Bangalore',
      'Looking for experienced DevOps engineer'
    ];
    
    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');
    
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

  const totalPages = Math.ceil(filteredRequirements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRequirements = filteredRequirements.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">My Requirements</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">Manage and track all your job requirements</p>
        </div>
        <button
          onClick={onCreateNew}
          className="px-5 py-2.5 sm:px-6 cursor-pointer sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-600/30 self-start sm:self-auto flex-shrink-0 text-sm sm:text-base"
        >
          <Plus size={18} />
          Create New
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Job ID or Role..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full h-11 sm:h-12 pl-11 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 rounded-xl p-1 flex-shrink-0">
          {(['all', 'open', 'closed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
              className={`px-3 cursor-pointer sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${statusFilter === s
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
              All Requirements ({filteredRequirements.length})
            </h2>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setBulkDeleteConfirmation({ show: true, count: selectedIds.size })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
              >
                <Trash size={16} />
                Delete Selected ({selectedIds.size})
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleDownloadTemplate}
              className="flex-1 sm:flex-none cursor-pointer px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Download</span> Template
            </button>
            <button
              onClick={triggerFileUpload}
              disabled={uploading}
              className="flex-1 cursor-pointer sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={15} />
                  Bulk Upload
                </>
              )}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredRequirements.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              No requirements found.
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
                <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-4 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      {isAllSelected ? (
                        <CheckSquare size={18} className="text-blue-600" />
                      ) : (
                        <Square size={18} className="text-slate-400" />
                      )}
                    </button>
                  </th>
                  {['S.No', 'Job ID', 'Role', 'Experience', 'Budget', 'Status', 'Matching Profiles', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${h === 'Actions' ? 'text-center' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {currentRequirements.map((req, index) => (
                  <tr
                    key={req.id}
                    className={`hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-150 group ${
                      selectedIds.has(req.id) ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''
                    }`}
                  >
                    <td className="px-4 py-5">
                      <button
                        onClick={() => toggleSelect(req.id)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                      >
                        {selectedIds.has(req.id) ? (
                          <CheckSquare size={18} className="text-blue-600" />
                        ) : (
                          <Square size={18} className="text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-blue-600 dark:text-blue-400">
                      {req.requirement_id || 'N/A'}
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {req.role || 'N/A'}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                      {formatExperience(req.experience_min, req.experience_max)}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formatBudget(req.budget_min, req.budget_max)}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full border ${
                          req.status === 'Open'
                            ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                            : 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                        }`}
                      >
                        {req.status || 'Open'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => handleViewMatches(req)}
                        className="inline-flex cursor-pointer px-4 py-2 text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 hover:text-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md border border-blue-200 dark:border-blue-800"
                      >
                        View {req.matches_count ?? 0}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(req)}
                          className="p-2.5 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 group-hover:scale-110"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(req)}
                          className="p-2.5 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 group-hover:scale-110"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(req)}
                          className="p-2.5 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 group-hover:scale-110"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRequirements.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {selectedRequirement && (
        <RequirementDetailModal
          requirement={selectedRequirement}
          mode={modalMode}
          onClose={() => setSelectedRequirement(null)}
          onUpdate={fetchRequirements} 
        />
      )}

      {deleteConfirmation.show && (
        <DeleteConfirmationModal
          title="Delete Requirement?"
          message={`Are you sure you want to delete requirement ${deleteConfirmation.label}? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {bulkDeleteConfirmation.show && (
        <DeleteConfirmationModal
          title="Delete Selected Requirements?"
          message={`Are you sure you want to delete ${bulkDeleteConfirmation.count} selected requirement(s)? This action cannot be undone.`}
          onConfirm={confirmBulkDelete}
          onCancel={cancelBulkDelete}
        />
      )}
    </div>
  );
}