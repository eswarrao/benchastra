import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
import { Search, Filter, FileText, Calendar, DollarSign, CheckCircle, Clock, X, Edit2, Save } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

// Shape returned by GET /contracts/
interface ApiContract {
  id: number;
  contract_id: string;
  client_id: number;
  vendor_id: number;
  requirement_id?: number;
  resource_id?: number;
  rate: number;
  billing_cycle: string;
  start_date: string;
  end_date: string;
  description?: string;
  status: 'Active' | 'Pending' | 'Completed';
  created_at: string;
  client_name?: string;
  vendor_name?: string;
  requirement_role?: string;
  resource_name?: string;
}

const getToken = () => localStorage.getItem('token') || localStorage.getItem('access_token');

const fmt = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

export function VendorContracts() {
  const { showSuccess, showError } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState<ApiContract | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [contracts, setContracts] = useState<ApiContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContract, setEditingContract] = useState<ApiContract | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    rate: '',
    billing_cycle: '',
    description: ''
  });

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

  const fetchContracts = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/contracts/`);
      if (response.ok) {
        const data = await response.json();
        setContracts(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch contracts:', response.status);
        setContracts([]);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContracts(); }, []);

  const handleStatusUpdate = async (contractId: number, status: string) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/contracts/${contractId}/status?status=${status}`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        showSuccess(`Contract status updated to ${status}`);
        setContracts(prev =>
          prev.map(c => c.id === contractId ? { ...c, status: status as ApiContract['status'] } : c)
        );
        if (selectedContract && selectedContract.id === contractId) {
          setSelectedContract({ ...selectedContract, status: status as ApiContract['status'] });
        }
        setShowEditModal(false);
      } else {
        const error = await response.json();
        showError(error.detail || 'Failed to update contract status');
      }
    } catch (error) {
      console.error('Error updating contract status:', error);
      showError('Failed to update contract status');
    }
  };

  const handleEditContract = (contract: ApiContract) => {
    setEditingContract(contract);
    setEditForm({
      status: contract.status,
      rate: contract.rate.toString(),
      billing_cycle: contract.billing_cycle,
      description: contract.description || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateContract = async () => {
    if (!editingContract) return;

    try {
      const updateData = {
        status: editForm.status,
        rate: parseFloat(editForm.rate),
        billing_cycle: editForm.billing_cycle,
        description: editForm.description
      };

      const response = await fetchWithAuth(`${API_BASE_URL}/contracts/${editingContract.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        showSuccess('Contract updated successfully!');
        setShowEditModal(false);
        setEditingContract(null);
        fetchContracts();
      } else {
        const error = await response.json();
        showError(error.detail || 'Failed to update contract');
      }
    } catch (error) {
      console.error('Error updating contract:', error);
      showError('Failed to update contract');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'Pending': return 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'Completed': return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const filteredContracts = contracts.filter(c =>
    (c.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.contract_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.requirement_role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Contracts</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Manage and monitor all your active contracts</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name or contract ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 sm:h-12 pl-11 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
        </div>
        <button className="flex items-center cursor-pointer gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex-shrink-0">
          <Filter size={18} />
          <span className="font-medium hidden sm:inline text-sm">Filter</span>
        </button>
      </div>

      {filteredContracts.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          {searchQuery ? `No contracts matching "${searchQuery}"` : 'No contracts found yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                    <FileText size={24} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">
                      {contract.client_name || 'Unknown Client'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{contract.contract_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEditContract(contract)}
                  className="p-2 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors"
                  title="Edit Contract"
                >
                  <Edit2 size={16} className="text-green-600 dark:text-green-400" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Contract Value</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    ₹{contract.rate?.toLocaleString()}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Duration</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {fmt(contract.start_date)} – {fmt(contract.end_date)}
                  </span>
                </div>
                {contract.requirement_role && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Role</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {contract.requirement_role}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(contract.status)}`}>
                    {contract.status}
                  </span>
                </div>
              </div>

              <button
                onClick={() => { setSelectedContract(contract); setShowDetailsModal(true); }}
                className="w-full py-3 cursor-pointer bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-600/30"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal - Green Theme */}
      {showDetailsModal && selectedContract && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
            style={{ maxHeight: 'calc(100vh - 1.5rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-white">Contract Details</h3>
                <p className="text-green-100 text-sm mt-1">{selectedContract.contract_id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { 
                    setShowDetailsModal(false);
                    handleEditContract(selectedContract);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                >
                  <Edit2 size={20} />
                </button>
                <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Client Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-500 dark:text-slate-400">Client Name</label>
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-200">
                      {selectedContract.client_name || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-500 dark:text-slate-400">Contract ID</label>
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-200">
                      {selectedContract.contract_id}
                    </div>
                  </div>
                  {selectedContract.resource_name && (
                    <div className="space-y-2">
                      <label className="text-sm text-slate-500 dark:text-slate-400">Resource</label>
                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-200">
                        {selectedContract.resource_name}
                      </div>
                    </div>
                  )}
                  {selectedContract.requirement_role && (
                    <div className="space-y-2">
                      <label className="text-sm text-slate-500 dark:text-slate-400">Role</label>
                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-200">
                        {selectedContract.requirement_role}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedContract.description && (
                <div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Description</h4>
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200">
                    {selectedContract.description}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Duration & Billing</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><Calendar size={16} /> Start Date</label>
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-200">
                      {fmt(selectedContract.start_date)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><Calendar size={16} /> End Date</label>
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-200">
                      {fmt(selectedContract.end_date)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><DollarSign size={16} /> Billing Cycle</label>
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-200">
                      {selectedContract.billing_cycle}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2"><DollarSign size={16} /> Contract Value</label>
                    <div className="px-4 py-3 bg-green-50 dark:bg-green-950/30 rounded-lg font-bold text-green-600 dark:text-green-400">
                      ₹{selectedContract.rate?.toLocaleString()}/mo
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Status</h4>
                <div className={`inline-flex px-4 py-2 rounded-xl font-semibold border items-center gap-2 ${getStatusColor(selectedContract.status)}`}>
                  {selectedContract.status === 'Active' && <CheckCircle size={18} />}
                  {selectedContract.status === 'Pending' && <Clock size={18} />}
                  {selectedContract.status === 'Completed' && <CheckCircle size={18} />}
                  {selectedContract.status}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 flex items-center gap-3 p-5 sm:p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-6 cursor-pointer py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
              {selectedContract.status === 'Pending' && (
                <button
                  onClick={() => { handleStatusUpdate(selectedContract.id, 'Active'); setShowDetailsModal(false); }}
                  className="flex-1 cursor-pointer px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-600/30"
                >
                  Mark Active
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Contract Modal - Green Theme */}
      {showEditModal && editingContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">Edit Contract</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-white/20 rounded-lg">
                <X size={24} className="text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Rate (₹/mo)</label>
                <input
                  type="number"
                  value={editForm.rate}
                  onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Billing Cycle</label>
                <select
                  value={editForm.billing_cycle}
                  onChange={(e) => setEditForm({ ...editForm, billing_cycle: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowEditModal(false)} className="flex-1 px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleUpdateContract} className="flex-1 cursor-pointer px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg shadow-green-600/30 hover:from-green-700 hover:to-emerald-700 transition-colors">
                  <Save size={18} className="inline mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}