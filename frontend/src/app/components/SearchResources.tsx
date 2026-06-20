import { useState, useEffect } from 'react';
import React from 'react'
import { Search, SlidersHorizontal, MapPin, Calendar, DollarSign, Eye, X, FileSearch } from 'lucide-react';
import { ResourceDetailModal } from './ResourceDetailModal';
import { Pagination } from './Pagination';

interface SearchResourcesProps {
  preFilteredJobId?: string;
  preFilteredCount?: number;
}

export function SearchResources({ preFilteredJobId, preFilteredCount }: SearchResourcesProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string[]>([]);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [showFilterBanner, setShowFilterBanner] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const itemsPerPage = 6;

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('access_token');

  const allSkills = ['DevOps', 'Java', 'Azure', 'Terraform', 'AWS', 'Docker', 'Kubernetes', 'Python', 'Jenkins', 'Ansible', 'React', 'Node.js', 'MongoDB'];

  // Fetch resources with filters
  const fetchResources = async () => {
    const token = getToken();
    if (!token) {
      console.log('No token found');
      return;
    }

    setLoading(true);
    try {
      let url = '/api/resources/?';
      const params: string[] = [];

      if (searchKeyword) {
        params.push(`search=${encodeURIComponent(searchKeyword)}`);
      }
      if (selectedSkills.length) {
        params.push(`skills=${selectedSkills.join(',')}`);
      }
      if (selectedExperience.length) {
        params.push(`experience=${selectedExperience.join(',')}`);
      }
      if (selectedAvailability.length) {
        params.push(`availability=${selectedAvailability.join(',')}`);
      }
      if (selectedBudget.length) {
        params.push(`budget=${selectedBudget.join(',')}`);
      }

      url += params.join('&');

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Format the data
        const formattedData = data.map((resource: any) => ({
          id: resource.id,
          resource_id: resource.resource_id,
          name: resource.name,
          role: resource.skill_domain || resource.name,
          experience: resource.experience || `${resource.experience_years || 0} yrs`,
          experience_years: resource.experience_years || 0,
          availability: resource.availability || 'Available',
          availability_days: resource.availability_days || 0,
          base_rate: resource.base_rate || 0,
          rate: resource.base_rate ? `₹${resource.base_rate.toLocaleString()}/mo` : '₹0/mo',
          location: resource.location || 'Unknown',
          skills: resource.skills || [],
          match: Math.floor(Math.random() * 30) + 70,
          status: resource.status || 'Active',
          email: resource.email || 'contact@vendor.com',
          phone: resource.phone || '+91 98765 43210',
          summary: resource.summary || `Experienced professional with ${resource.experience || '5+'} years of experience.`
        }));
        setResources(formattedData);
        setTotalResults(formattedData.length);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchResources();
  }, [selectedSkills, selectedExperience, selectedAvailability, selectedBudget, searchKeyword]);

  // Handle pre-filtered job matches
  useEffect(() => {
    if (preFilteredJobId) {
      setShowFilterBanner(true);
      fetchMatchesForJob(preFilteredJobId);
    }
  }, [preFilteredJobId]);

  const fetchMatchesForJob = async (jobId: string) => {
    const token = getToken();
    if (!token) return;

    // Find the requirement by its string ID to get the numeric ID
    try {
      // First get all requirements to find the one with matching requirement_id
      const reqResponse = await fetch('/api/requirements/?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (reqResponse.ok) {
        const requirements = await reqResponse.json();
        const requirement = requirements.find((r: any) => r.requirement_id === jobId);

        if (requirement) {
          // Use the numeric ID for the matches endpoint
          const response = await fetch(`/api/requirements/${requirement.id}/matches`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            const formattedData = data.map((match: any) => ({
              id: match.id,
              resource_id: match.resource_id,
              name: match.resource_name,
              role: match.requirement_role,
              experience: match.resource_experience,
              availability: match.resource_availability,
              rate: match.resource_rate ? `₹${match.resource_rate.toLocaleString()}/mo` : '₹0/mo',
              location: 'Various',
              skills: match.resource_skills || [],
              match: match.match_score,
              status: 'Available'
            }));
            setResources(formattedData);
            setTotalResults(formattedData.length);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
    setCurrentPage(1);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
    setCurrentPage(1);
  };

  const toggleExperience = (exp: string) => {
    setSelectedExperience(prev =>
      prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]
    );
    setCurrentPage(1);
  };

  const toggleAvailability = (avail: string) => {
    setSelectedAvailability(prev =>
      prev.includes(avail) ? prev.filter(a => a !== avail) : [...prev, avail]
    );
    setCurrentPage(1);
  };

  const toggleBudget = (budget: string) => {
    setSelectedBudget(prev =>
      prev.includes(budget) ? prev.filter(b => b !== budget) : [...prev, budget]
    );
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedSkills([]);
    setSelectedExperience([]);
    setSelectedAvailability([]);
    setSelectedBudget([]);
    setSearchKeyword('');
    setCurrentPage(1);
  };

  const matchesExperienceFilter = (exp: string) => {
    if (selectedExperience.length === 0) return true;
    const years = parseInt(exp);
    return selectedExperience.some(filter => {
      if (filter === '1-3 yrs') return years >= 1 && years <= 3;
      if (filter === '4-6 yrs') return years >= 4 && years <= 6;
      if (filter === '7-10 yrs') return years >= 7 && years <= 10;
      if (filter === '10+ yrs') return years > 10;
      return false;
    });
  };

  const matchesBudgetFilter = (rate: string) => {
    if (selectedBudget.length === 0) return true;
    const amount = parseInt(rate.replace(/[^\d]/g, ''));
    return selectedBudget.some(filter => {
      if (filter === '< 80K') return amount < 80000;
      if (filter === '80K-1.2L') return amount >= 80000 && amount < 120000;
      if (filter === '1.2L-1.5L') return amount >= 120000 && amount <= 150000;
      if (filter === '> 1.5L') return amount > 150000;
      return false;
    });
  };

  const filteredResources = resources.filter(resource => {
    const skillMatch = selectedSkills.length === 0 || selectedSkills.some(skill =>
      resource.skills?.some((s: string) => s.toLowerCase().includes(skill.toLowerCase()))
    );
    const expMatch = matchesExperienceFilter(resource.experience);
    const availMatch = selectedAvailability.length === 0 || selectedAvailability.includes(resource.availability);
    const budgetMatch = matchesBudgetFilter(resource.rate);
    const searchMatch = searchKeyword === '' ||
      resource.name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      resource.role?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      resource.skills?.some((s: string) => s.toLowerCase().includes(searchKeyword.toLowerCase()));

    return skillMatch && expMatch && availMatch && budgetMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResources = preFilteredJobId
    ? filteredResources.slice(0, preFilteredCount || 6)
    : filteredResources.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Filters Panel */}
      <div className={`w-full md:w-72 md:flex-shrink-0 ${isMobileFilterOpen ? 'block' : 'hidden md:block'}`}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-border dark:border-slate-700 p-6 sticky top-24">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <SlidersHorizontal size={20} className="text-primary" />
              Filters
            </h3>
            <button
              onClick={resetFilters}
              className="text-sm cursor-pointer text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="space-y-6">
            {/* Skill Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Skill</label>
              <div className="flex flex-wrap gap-2">
                {allSkills.map(skill => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 cursor-pointer text-xs font-semibold rounded-full transition-all duration-200 ${selectedSkills.includes(skill)
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-primary'
                      }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Experience</label>
              <div className="space-y-2">
                {['1-3 yrs', '4-6 yrs', '7-10 yrs', '10+ yrs'].map(exp => (
                  <label key={exp} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedExperience.includes(exp)}
                      onChange={() => toggleExperience(exp)}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {exp}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Availability</label>
              <div className="space-y-2">
                {['Immediate', '< 15 days', '< 30 days', '60+ days'].map(avail => (
                  <label key={avail} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedAvailability.includes(avail)}
                      onChange={() => toggleAvailability(avail)}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {avail}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Budget Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Budget (₹/mo)</label>
              <div className="space-y-2">
                {['< 80K', '80K-1.2L', '1.2L-1.5L', '> 1.5L'].map(budget => (
                  <label key={budget} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedBudget.includes(budget)}
                      onChange={() => toggleBudget(budget)}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {budget}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="flex-1 min-w-0">
        {/* Mobile filter toggle */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <h1 className="text-2xl font-bold text-foreground">Search Resources</h1>
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex cursor-pointer items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg text-sm font-medium text-foreground shadow-sm"
          >
            <SlidersHorizontal size={15} className="text-primary" />
            Filters
          </button>
        </div>

        {/* Filter Banner */}
        {showFilterBanner && preFilteredJobId && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 border-2 border-primary/30 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Eye size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Filtered Results for {preFilteredJobId}</h3>
                <p className="text-sm text-muted-foreground">Showing {preFilteredCount} matching profiles</p>
              </div>
            </div>
            <button
              onClick={() => setShowFilterBanner(false)}
              className="p-2 cursor-pointer hover:bg-white/80 rounded-lg transition-all"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-foreground">Search Resources</h1>
            <span className="text-sm font-medium text-muted-foreground">{filteredResources.length} results</span>
          </div>
          <p className="text-muted-foreground mb-4">Filter and discover bench talent</p>

          {/* Search Bar - This is the main search */}
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, role, skills, or location... (e.g., DevOps, Bangalore, Python)"
              value={searchKeyword}
              onChange={handleSearch}
              className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : currentResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <FileSearch size={40} className="text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No matching profiles found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters or search keywords</p>
            <button
              onClick={resetFilters}
              className="px-6 py-2.5 cursor-pointer bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {currentResources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-border dark:border-slate-700 hover:shadow-xl hover:border-primary/30 transition-all duration-300 relative"
                >
                  {/* Match Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${resource.match >= 90 ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' :
                        resource.match >= 85 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400' :
                          'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                      }`}>
                      {resource.match}% Match
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-md">
                      {resource.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-primary">{resource.resource_id || resource.id}</span>
                        {resource.status === 'Booked Soon' && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                            Booked Soon
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">{resource.role}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{resource.experience}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {resource.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar size={16} />
                      <span>{resource.availability}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-green-600 font-medium">
                      <DollarSign size={16} />
                      <span>{resource.rate}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {resource.skills?.slice(0, 4).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs font-medium bg-accent text-accent-foreground rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedResource(resource)}
                    className="w-full h-11 cursor-pointer bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
                  >
                    <Eye size={16} />
                    View Profile
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {!preFilteredJobId && totalPages > 1 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-border dark:border-slate-700 overflow-hidden">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredResources.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Resource Detail Modal */}
      {selectedResource && (
        <ResourceDetailModal
          resource={{
            id: selectedResource.resource_id || selectedResource.id,
            name: selectedResource.name,
            role: selectedResource.role,
            experience: selectedResource.experience,
            availability: selectedResource.availability,
            rate: selectedResource.rate,
            location: selectedResource.location,
            email: selectedResource.email || 'contact@vendor.com',
            phone: selectedResource.phone || '+91 98765 43210',
            skills: selectedResource.skills || [],
            summary: selectedResource.summary || `Experienced professional with ${selectedResource.experience} of experience.`,
            match: selectedResource.match || 85,
          }}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
}