import { X, MapPin, Mail, Phone, Calendar, DollarSign } from 'lucide-react';

interface ResourceDetailModalProps {
  resource: {
    id: string;
    name: string;
    role: string;
    experience: string;
    availability: string;
    rate: string;
    location: string;
    email: string;
    phone: string;
    skills: string[];
    summary: string;
    match: number;
  };
  onClose: () => void;
}

export function ResourceDetailModal({ resource, onClose }: ResourceDetailModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card dark:bg-card rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col animate-in zoom-in-95 duration-200"
        style={{ maxHeight: 'calc(100vh - 1.5rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-card dark:bg-card border-b border-border p-4 sm:p-6 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-blue-600/30">
              {resource.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold text-foreground">{resource.name}</h2>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  resource.match >= 90 ? 'bg-green-100 text-green-700' :
                  resource.match >= 85 ? 'bg-orange-100 text-orange-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {resource.match}% Match
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{resource.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 cursor-pointer hover:bg-secondary rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Role & Experience */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">{resource.role}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-medium">{resource.experience} experience</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {resource.location}
              </span>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {resource.skills.map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1.5 text-sm font-medium bg-accent text-accent-foreground rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Summary</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {resource.summary}
            </p>
          </div>

          {/* Availability & Rate */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar size={16} />
                <span className="text-xs font-medium">Availability</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{resource.availability}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign size={16} />
                <span className="text-xs font-medium">Rate</span>
              </div>
              <p className="text-lg font-semibold text-green-600">{resource.rate}</p>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Contact Details</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground">
                  <Mail size={16} />
                </div>
                <span className="text-foreground">{resource.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground">
                  <Phone size={16} />
                </div>
                <span className="text-foreground">{resource.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-card dark:bg-card border-t border-border p-4 sm:p-6 flex items-center gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 cursor-pointer h-11 px-6 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-secondary transition-all"
          >
            Close
          </button>
          <button className="flex-1 cursor-pointer h-11 px-6 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-lg transition-all shadow-lg shadow-primary/25">
            Contact Resource
          </button>
        </div>
      </div>
    </div>
  );
}
