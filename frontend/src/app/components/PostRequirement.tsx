import { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle2, X, Plus } from 'lucide-react';
import { DatePicker } from './DatePicker';
import React from 'react';

interface PostRequirementProps {
  onClose: () => void;
}

interface FormErrors {
  role?: string;
  experienceMin?: string;
  experienceMax?: string;
  positions?: string;
  skills?: string;
  budgetMin?: string;
  budgetMax?: string;
  description?: string;
}

export function PostRequirement({ onClose }: PostRequirementProps) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [newSkill, setNewSkill] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    role: '',
    experienceMin: '',
    experienceMax: '',
    positions: '',
    skills: [] as string[],
    mustHaveSkills: [] as string[],
    budgetMin: '',
    budgetMax: '',
    duration: '6 Months',
    workMode: 'Remote',
    startDate: 'Immediate',
    customStartDate: '',
    description: '',
  });

  const availableSkills = [
    'Terraform', 'Kubernetes', 'AWS', 'Docker', 'Python', 'Ansible', 'Azure', 'Jenkins', 'Git', 'Linux'
  ];

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (stepNumber === 1) {
      if (!formData.role.trim()) {
        newErrors.role = 'Role is required';
        isValid = false;
      }
      if (!formData.experienceMin.trim()) {
        newErrors.experienceMin = 'Minimum experience is required';
        isValid = false;
      } else if (isNaN(Number(formData.experienceMin)) || Number(formData.experienceMin) < 0) {
        newErrors.experienceMin = 'Please enter a valid number';
        isValid = false;
      }
      if (!formData.experienceMax.trim()) {
        newErrors.experienceMax = 'Maximum experience is required';
        isValid = false;
      } else if (isNaN(Number(formData.experienceMax)) || Number(formData.experienceMax) < 0) {
        newErrors.experienceMax = 'Please enter a valid number';
        isValid = false;
      }
      if (formData.experienceMin && formData.experienceMax) {
        if (Number(formData.experienceMin) > Number(formData.experienceMax)) {
          newErrors.experienceMax = 'Max experience must be greater than min';
          isValid = false;
        }
      }
      if (!formData.positions.trim()) {
        newErrors.positions = 'Number of positions is required';
        isValid = false;
      } else if (isNaN(Number(formData.positions)) || Number(formData.positions) < 1) {
        newErrors.positions = 'Please enter a valid number of positions';
        isValid = false;
      }
    }

    if (stepNumber === 2) {
      if (formData.skills.length === 0) {
        newErrors.skills = 'Please select at least one skill';
        isValid = false;
      }
    }

    if (stepNumber === 3) {
      if (!formData.budgetMin.trim()) {
        newErrors.budgetMin = 'Minimum budget is required';
        isValid = false;
      } else if (isNaN(Number(formData.budgetMin)) || Number(formData.budgetMin) < 0) {
        newErrors.budgetMin = 'Please enter a valid amount';
        isValid = false;
      }
      if (!formData.budgetMax.trim()) {
        newErrors.budgetMax = 'Maximum budget is required';
        isValid = false;
      } else if (isNaN(Number(formData.budgetMax)) || Number(formData.budgetMax) < 0) {
        newErrors.budgetMax = 'Please enter a valid amount';
        isValid = false;
      }
      if (formData.budgetMin && formData.budgetMax) {
        if (Number(formData.budgetMin) > Number(formData.budgetMax)) {
          newErrors.budgetMax = 'Max budget must be greater than min';
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const addSkill = (skill: string) => {
    if (!formData.skills.includes(skill) && skill.trim()) {
      setFormData({ ...formData, skills: [...formData.skills, skill.trim()] });
      setErrors({ ...errors, skills: undefined });
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const handleAddNewSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      addSkill(newSkill.trim());
      setNewSkill('');
      setShowSkillInput(false);
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 3) setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    setErrors({});
  };

  const handleDateSelect = (date: string) => {
    setFormData({ ...formData, customStartDate: date });
    setShowDatePicker(false);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/requirements/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: formData.role,
          experience_min: parseInt(formData.experienceMin),
          experience_max: parseInt(formData.experienceMax),
          positions: parseInt(formData.positions),
          skills: formData.skills,
          must_have_skills: formData.mustHaveSkills,
          budget_min: parseFloat(formData.budgetMin),
          budget_max: parseFloat(formData.budgetMax),
          duration: formData.duration,
          work_mode: formData.workMode,
          start_date: formData.startDate,
          custom_start_date: formData.customStartDate || null,
          location: "Bangalore",
          description: formData.description
        })
      });

      if (response.ok) {
        onClose();
      } else {
        const error = await response.json();
        console.error('Submission error:', error);
        alert('Failed to post requirement. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: 'calc(100vh - 1.5rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0 px-6 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Post Requirement <span className="text-lg">🔥</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Define talent need with precision</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <X size={20} className="text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Step Indicator - Reduced spacing */}
          <div className="flex items-start justify-center gap-4">
            {[
              { num: 1, label: 'Basic Info' },
              { num: 2, label: 'Skills' },
              { num: 3, label: 'Budget & Duration' }
            ].map(({ num, label }, index) => (
              <React.Fragment key={num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs transition-all duration-300 ${num === step
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40 scale-105'
                        : num < step
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 border-2 border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-2 border-slate-200 dark:border-slate-600'
                      }`}
                  >
                    {num < step ? <CheckCircle2 size={14} /> : num}
                  </div>

                  <span
                    className={`text-[10px] font-medium mt-0.5 whitespace-nowrap ${num === step
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400 dark:text-slate-500'
                      }`}
                  >
                    {label}
                  </span>
                </div>

                {index < 2 && (
                  <div
                    className={`w-12 h-0.5 mt-4 rounded-full transition-all duration-300 ${num < step
                        ? 'bg-blue-600'
                        : 'bg-slate-200 dark:bg-slate-600'
                      }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-blue-600 dark:text-blue-400">Basic Info</h2>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Role (e.g., DevOps Engineer) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={e => {
                      setFormData({ ...formData, role: e.target.value });
                      if (errors.role) setErrors({ ...errors, role: undefined });
                    }}
                    placeholder="Enter role title"
                    className={`w-full h-10 px-3 bg-white dark:bg-slate-800 border ${errors.role ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                      } text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-sm`}
                  />
                  {errors.role && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.role}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Min Experience (yrs) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.experienceMin}
                      onChange={e => {
                        setFormData({ ...formData, experienceMin: e.target.value });
                        if (errors.experienceMin) setErrors({ ...errors, experienceMin: undefined });
                      }}
                      placeholder="3"
                      className={`w-full h-10 px-3 bg-white dark:bg-slate-800 border ${errors.experienceMin ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                        } text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-sm`}
                    />
                    {errors.experienceMin && (
                      <p className="text-xs text-red-500 mt-0.5">{errors.experienceMin}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Max Experience (yrs) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.experienceMax}
                      onChange={e => {
                        setFormData({ ...formData, experienceMax: e.target.value });
                        if (errors.experienceMax) setErrors({ ...errors, experienceMax: undefined });
                      }}
                      placeholder="5"
                      className={`w-full h-10 px-3 bg-white dark:bg-slate-800 border ${errors.experienceMax ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                        } text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-sm`}
                    />
                    {errors.experienceMax && (
                      <p className="text-xs text-red-500 mt-0.5">{errors.experienceMax}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    No. of Positions <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.positions}
                    onChange={e => {
                      setFormData({ ...formData, positions: e.target.value });
                      if (errors.positions) setErrors({ ...errors, positions: undefined });
                    }}
                    placeholder="1"
                    className={`w-full h-10 px-3 bg-white dark:bg-slate-800 border ${errors.positions ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                      } text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-sm`}
                  />
                  {errors.positions && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.positions}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Skills */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-blue-600 dark:text-blue-400">Skills</h2>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Must Have Skills <span className="text-red-500">*</span>
                  </label>

                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {formData.skills.map(skill => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-xs font-medium shadow-md"
                        >
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="hover:bg-white/20 rounded-full p-0.5 cursor-pointer transition-colors"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1.5">
                    {availableSkills.map(skill => (
                      <button
                        key={skill}
                        onClick={() => addSkill(skill)}
                        disabled={formData.skills.includes(skill)}
                        className={`px-2.5 py-1.5 cursor-pointer text-xs font-medium rounded-lg border transition-all ${formData.skills.includes(skill)
                            ? 'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                          }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>

                  {/* Add New Skill */}
                  {showSkillInput ? (
                    <div className="flex gap-1.5 mt-2.5">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Enter new skill"
                        className="flex-1 h-8 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewSkill();
                          }
                        }}
                      />
                      <button
                        onClick={handleAddNewSkill}
                        className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowSkillInput(false);
                          setNewSkill('');
                        }}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSkillInput(true)}
                      className="w-full cursor-pointer mt-2 px-2.5 py-1.5 text-xs font-medium bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-lg border-2 border-dashed border-blue-600 hover:bg-blue-600/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} />
                      Add new skill
                    </button>
                  )}

                  {errors.skills && (
                    <p className="text-xs text-red-500 mt-1">{errors.skills}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Good to Have Skills
                  </label>
                  <input
                    type="text"
                    placeholder="Python, Ansible, Jenkins"
                    className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Budget & Duration */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-blue-600 dark:text-blue-400">Budget & Duration</h2>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Min Budget (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.budgetMin}
                      onChange={e => {
                        setFormData({ ...formData, budgetMin: e.target.value });
                        if (errors.budgetMin) setErrors({ ...errors, budgetMin: undefined });
                      }}
                      placeholder="100000"
                      className={`w-full h-10 px-3 bg-white dark:bg-slate-800 border ${errors.budgetMin ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                        } text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-sm`}
                    />
                    {errors.budgetMin && (
                      <p className="text-xs text-red-500 mt-0.5">{errors.budgetMin}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Max Budget (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.budgetMax}
                      onChange={e => {
                        setFormData({ ...formData, budgetMax: e.target.value });
                        if (errors.budgetMax) setErrors({ ...errors, budgetMax: undefined });
                      }}
                      placeholder="150000"
                      className={`w-full h-10 px-3 bg-white dark:bg-slate-800 border ${errors.budgetMax ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                        } text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-sm`}
                    />
                    {errors.budgetMax && (
                      <p className="text-xs text-red-500 mt-0.5">{errors.budgetMax}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['3 Months', '6 Months', '12 Months', 'Custom'].map(dur => (
                      <button
                        key={dur}
                        onClick={() => setFormData({ ...formData, duration: dur })}
                        className={`py-1.5 cursor-pointer text-xs font-semibold rounded-lg transition-all duration-200 ${formData.duration === dur
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-600'
                          }`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Work Mode</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Remote', 'Hybrid', 'Onsite'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setFormData({ ...formData, workMode: mode })}
                        className={`py-1.5 cursor-pointer text-sm font-semibold rounded-lg transition-all duration-200 ${formData.workMode === mode
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-600'
                          }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative" ref={datePickerRef}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      {['Immediate', 'Pick Date'].map(date => (
                        <button
                          key={date}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, startDate: date });
                            if (date === 'Pick Date') {
                              setShowDatePicker(true);
                            } else {
                              setShowDatePicker(false);
                            }
                          }}
                          className={`py-1.5 cursor-pointer text-sm font-semibold rounded-lg transition-all duration-200 ${formData.startDate === date
                              ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                              : 'bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-green-500 hover:bg-green-50 dark:hover:bg-slate-600'
                            }`}
                        >
                          {date === 'Immediate' && <CheckCircle2 size={14} className="inline mr-1" />}
                          {date}
                        </button>
                      ))}
                    </div>

                    {/* Date Picker - Appears ABOVE the button */}
                    {showDatePicker && formData.startDate === 'Pick Date' && (
                      <div className="absolute bottom-full left-0 mb-2 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 w-full">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Date</span>
                          <button
                            onClick={() => setShowDatePicker(false)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <X size={16} className="text-slate-400" />
                          </button>
                        </div>
                        <DatePicker
                          value={formData.customStartDate}
                          onChange={(date) => {
                            handleDateSelect(date);
                          }}
                          disabled={formData.startDate !== 'Pick Date'}
                        />
                      </div>
                    )}

                    {formData.startDate === 'Pick Date' && formData.customStartDate && (
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        Selected: {formData.customStartDate}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={step === 1 ? onClose : handleBack}
            className="px-4 py-1.5 text-sm cursor-pointer font-semibold text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="px-5 py-1.5 text-sm cursor-pointer font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-600/25"
            >
              Next
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-1.5 text-sm cursor-pointer font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'POST REQUIREMENT'}
              {!isSubmitting && <ArrowRight size={14} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}