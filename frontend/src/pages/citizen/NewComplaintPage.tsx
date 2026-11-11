import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Category } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { ComplaintMap } from '../../components/maps/ComplaintMap';
import {
  FilePlus,
  AlertTriangle,
  Building,
  Sparkles,
  MapPin,
  Upload,
  X,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const NewComplaintPage: React.FC = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [immediateDanger, setImmediateDanger] = useState(false);
  const [isEssentialFacility, setIsEssentialFacility] = useState(false);
  const [facilityType, setFacilityType] = useState('none');
  const [reportedDurationDays, setReportedDurationDays] = useState(0);
  const [approxLocation, setApproxLocation] = useState('');
  const [latitude, setLatitude] = useState<number>(13.0827);
  const [longitude, setLongitude] = useState<number>(80.2707);
  const [contactPhone, setContactPhone] = useState('');

  // Evidence files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // AI Classification suggestion state
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedCategoryInfo, setSuggestedCategoryInfo] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.request<any>('/categories')
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  const handleAutoSuggestCategory = async () => {
    if (!description || description.trim().length < 5) {
      setErrorMsg('Please enter a description first to auto-suggest the category.');
      return;
    }
    setErrorMsg('');
    setIsSuggesting(true);
    try {
      const res: any = await api.request('/categories/predict', {
        method: 'POST',
        body: JSON.stringify({ text: `${title} ${description}` }),
      });
      if (res.data?.category_id) {
        setCategoryId(res.data.category_id);
        setSuggestedCategoryInfo(res.data.reason || 'Category matched based on keywords.');
      }
    } catch (err: any) {
      setErrorMsg('Failed to auto-suggest category.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    
    // Check max size (10MB)
    for (const f of newFiles) {
      if (f.size > 10 * 1024 * 1024) {
        setErrorMsg(`File '${f.name}' exceeds the 10MB maximum limit.`);
        return;
      }
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Create previews for images
    newFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (re) => {
          if (re.target?.result) {
            setFilePreviews((prev) => [...prev, re.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!categoryId) {
      setErrorMsg('Please select a municipal category.');
      return;
    }

    if (title.trim().length < 5) {
      setErrorMsg('Title must be at least 5 characters.');
      return;
    }

    if (description.trim().length < 15) {
      setErrorMsg('Description must be at least 15 characters.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create complaint record
      const complaintRes: any = await api.request('/complaints', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category_id: Number(categoryId),
          latitude,
          longitude,
          approx_location: approxLocation.trim() || undefined,
          contact_phone: contactPhone.trim() || undefined,
          immediate_danger: immediateDanger,
          is_essential_facility: isEssentialFacility,
          facility_type: isEssentialFacility && facilityType !== 'none' ? facilityType : undefined,
          reported_duration_days: Number(reportedDurationDays),
        }),
      });

      const newComplaintId = complaintRes.data?.id;

      // 2. Upload any selected evidence files
      if (selectedFiles.length > 0 && newComplaintId) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          await api.upload(`/complaints/${newComplaintId}/evidence`, formData);
        }
      }

      navigate(`/citizen/complaints/${newComplaintId}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit grievance. Please verify all fields.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">File a New Grievance</h1>
        <p className="text-xs text-slate-500 mt-1">
          Your complaint will be deterministically prioritized with transparent rule explanations and assigned to the relevant department.
        </p>
      </div>

      <Card className="shadow-md">
        <CardContent className="pt-6">
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Grievance Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Major drinking water pipeline leak near Govt Hospital"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
                required
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoSuggestCategory}
                  disabled={isSuggesting}
                  className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isSuggesting ? 'Analyzing...' : 'Auto-suggest Category'}
                </button>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, landmarks, severity, and community impact in English or தமிழ்..."
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
                required
              />
              {suggestedCategoryInfo && (
                <p className="text-[11px] text-sky-700 bg-sky-50 p-2 rounded border border-sky-200 mt-1.5">
                  💡 {suggestedCategoryInfo}
                </p>
              )}
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department & Service Category <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
                required
              >
                <option value="">-- Select municipal category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.department_name} • {cat.default_sla_hours}h SLA)
                  </option>
                ))}
              </select>
            </div>

            {/* Structured Urgency Indicators */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Objective Severity Factors
              </h4>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={immediateDanger}
                  onChange={(e) => setImmediateDanger(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 accent-slate-900"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">
                    Immediate Public Safety Danger
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Sparks from live wires, open manholes on dark roads, cave-ins, or physical collapse risks (+30 priority points).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEssentialFacility}
                  onChange={(e) => setIsEssentialFacility(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 accent-slate-900"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">
                    Essential Public Facility Impact
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Interruption directly affects a hospital, clinic, school, or municipal water plant (+20 to +35 priority points).
                  </span>
                </div>
              </label>

              {isEssentialFacility && (
                <div className="pl-6 pt-1">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Designated Facility Type
                  </label>
                  <select
                    value={facilityType}
                    onChange={(e) => setFacilityType(e.target.value)}
                    className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white"
                  >
                    <option value="none">General Public Facility</option>
                    <option value="hospital">Government / Trauma Hospital (+15 pts)</option>
                    <option value="school">Primary / Secondary School (+15 pts)</option>
                    <option value="clinic">Public Health Clinic (+15 pts)</option>
                    <option value="water_plant">Water Treatment / Pumping Station (+15 pts)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reported Unresolved Duration (in days)
                </label>
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={reportedDurationDays}
                  onChange={(e) => setReportedDurationDays(Number(e.target.value))}
                  className="w-32 text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white"
                />
                <span className="text-[11px] text-slate-500 ml-2">
                  (Persisting for 3 or more days grants +10 priority points)
                </span>
              </div>
            </div>

            {/* Location & Interactive Map Pin */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approximate Location / Street Name
                </label>
                <input
                  type="text"
                  value={approxLocation}
                  onChange={(e) => setApproxLocation(e.target.value)}
                  placeholder="E.g., 4th Cross Road, Ward 12, Anna Nagar"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Position Pin on Map (Optional Geo-tagging)
                </label>
                <ComplaintMap
                  initialLat={latitude}
                  initialLng={longitude}
                  onLocationSelect={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                  isInteractive={true}
                  className="h-52 w-full rounded-md border border-slate-300"
                />
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Evidence File Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Attach Evidence Photos / Documents (Max 10MB each)
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-slate-400 transition-colors">
                <input
                  type="file"
                  id="evidence-input"
                  multiple
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="evidence-input" className="cursor-pointer space-y-1 block">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <span className="text-xs font-semibold text-sky-600 block">
                    Click to select files
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    PNG, JPG, WEBP, or PDF
                  </span>
                </label>
              </div>

              {/* Previews / Selected Files list */}
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-slate-50 border border-slate-200 rounded relative text-xs flex flex-col justify-between"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                        title="Remove file"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="truncate text-[11px] font-medium text-slate-700 pr-4">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {(file.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone for Status Notifications
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => navigate('/citizen/dashboard')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" className="font-semibold shadow-xs" isLoading={isLoading}>
                <FilePlus className="w-4 h-4 mr-2" />
                Submit Grievance
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
