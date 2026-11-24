import React, { useState } from 'react';
import { Edit2, LogIn, Plus, Trash2, UserCheck } from 'lucide-react';
import type {
  ActivityType,
  AgeGroup,
  AirQualitySnapshot,
  FamilyMemberProfile,
  HouseholdExposureSummary,
  OutdoorExposureLevel,
  SensitivityCategory,
} from '../types/breathewise.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface FamilyHealthViewProps {
  airQuality: AirQualitySnapshot | null;
  familyMembers: FamilyMemberProfile[];
  exposure: HouseholdExposureSummary | null;
  onAddMember: (member: Omit<FamilyMemberProfile, 'id'>) => Promise<void>;
  onUpdateMember: (id: number, member: Omit<FamilyMemberProfile, 'id'>) => Promise<void>;
  onDeleteMember: (id: number) => Promise<void>;
}

const AGE_GROUPS: AgeGroup[] = [
  'Child (0-12)',
  'Teen (13-17)',
  'Adult (18-59)',
  'Elderly (60+)',
];

const ACTIVITY_TYPES: ActivityType[] = [
  'School Commute',
  'Outdoor Worker',
  'Morning Jogger',
  'Daily Commuter',
  'Indoor / Homebound',
];

const SENSITIVITIES: SensitivityCategory[] = [
  'None',
  'Asthma / Respiratory',
  'Allergic Rhinitis',
  'Cardiac Sensitivity',
  'Pregnancy',
];

const EXPOSURE_LEVELS: OutdoorExposureLevel[] = [
  'Low (<1 hr/day)',
  'Moderate (1-3 hrs/day)',
  'High (>3 hrs/day)',
];

export function FamilyHealthView({
  airQuality,
  familyMembers,
  exposure,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
}: FamilyHealthViewProps) {
  const { user, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('Child (0-12)');
  const [activityType, setActivityType] = useState<ActivityType>('School Commute');
  const [sensitivity, setSensitivity] = useState<SensitivityCategory>('None');
  const [outdoorExposure, setOutdoorExposure] = useState<OutdoorExposureLevel>(
    'Moderate (1-3 hrs/day)'
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setAgeGroup('Child (0-12)');
    setActivityType('School Commute');
    setSensitivity('None');
    setOutdoorExposure('Moderate (1-3 hrs/day)');
    setEditingId(null);
    setFormError(null);
  };

  const handleEdit = (member: FamilyMemberProfile) => {
    setEditingId(member.id);
    setName(member.name);
    setAgeGroup(member.ageGroup);
    setActivityType(member.activityType);
    setSensitivity(member.sensitivity);
    setOutdoorExposure(member.outdoorExposure);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter a name or nickname.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        name: name.trim(),
        ageGroup,
        activityType,
        sensitivity,
        outdoorExposure,
      };
      if (editingId !== null) {
        await onUpdateMember(editingId, payload);
      } else {
        await onAddMember(payload);
      }
      resetForm();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Unable to save family member.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Family Health & Exposure Profiles
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Tailor pollution precautions for children, elderly family members, outdoor workers, and sensitive lungs.
          </p>
        </div>

        {exposure && (
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-right">
            <p className="text-xs text-slate-500">Household Exposure Score</p>
            <p className="font-mono-num text-xl font-bold text-slate-900">
              {exposure.overallScore}/100 · {exposure.band}
            </p>
          </div>
        )}
      </div>

      {!user && (
        <div className="bg-teal-50/70 border border-teal-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-teal-950">
            Profiles added now are active immediately in this session. Sign in with Google to save your family profiles to PostgreSQL across devices.
          </p>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg whitespace-nowrap"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In to Sync
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Add / Edit Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <h2 className="font-display text-base font-semibold text-slate-900">
            {editingId !== null ? 'Edit Family Member' : 'Add Family Member'}
          </h2>

          <div>
            <label htmlFor="member-name" className="block text-xs font-medium text-slate-700 mb-1">
              Name or Nickname
            </label>
            <input
              id="member-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Aarav, Dadi, Priya"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="member-age" className="block text-xs font-medium text-slate-700 mb-1">
                Age Group
              </label>
              <select
                id="member-age"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {AGE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="member-activity"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Activity Pattern
              </label>
              <select
                id="member-activity"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as ActivityType)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {ACTIVITY_TYPES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="member-sensitivity"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Sensitivity (Optional)
              </label>
              <select
                id="member-sensitivity"
                value={sensitivity}
                onChange={(e) => setSensitivity(e.target.value as SensitivityCategory)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {SENSITIVITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="member-exposure"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Outdoor Exposure
              </label>
              <select
                id="member-exposure"
                value={outdoorExposure}
                onChange={(e) => setOutdoorExposure(e.target.value as OutdoorExposureLevel)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {EXPOSURE_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && <p className="text-xs text-red-700">{formError}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              {submitting
                ? 'Saving...'
                : editingId !== null
                ? 'Save Changes'
                : 'Add Member'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
            Privacy & Medical Notice: We only collect general age and activity patterns to customize protective guidance. BreatheWise AI does not diagnose medical conditions or prescribe medication.
          </p>
        </form>

        {/* Member Cards & Personalized Precautions */}
        <div className="lg:col-span-7 space-y-4">
          {familyMembers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <UserCheck className="w-8 h-8 text-teal-700 mx-auto" />
              <h3 className="font-display font-semibold text-base text-slate-900 mt-3">
                No family members added yet
              </h3>
              <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                Add children, elderly parents, commuters, or sensitive individuals to see tailored Exposure Scores and daily precautions for {airQuality?.city ?? 'your city'}.
              </p>
            </div>
          ) : (
            familyMembers.map((member) => {
              const assessment = exposure?.memberAssessments.find(
                (a) => a.memberId === member.id
              );
              return (
                <article
                  key={member.id}
                  className="bg-white border border-slate-200 rounded-xl p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display font-semibold text-base text-slate-900">
                        {member.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {member.ageGroup} · {member.activityType} · {member.outdoorExposure}
                        {member.sensitivity !== 'None' ? ` · ${member.sensitivity}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {assessment && (
                        <div className="text-right">
                          <span className="font-mono-num text-sm font-bold text-slate-900">
                            {assessment.exposureScore}/100
                          </span>
                          <span className="block text-[11px] text-slate-500">
                            {assessment.exposureBand} Exposure
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEdit(member)}
                        aria-label={`Edit ${member.name}`}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteMember(member.id)}
                        aria-label={`Remove ${member.name}`}
                        className="p-1.5 text-slate-500 hover:text-red-700 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {assessment && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          Recommended Precautions ({airQuality?.cpcbAqi ?? '—'} AQI)
                        </p>
                        <ul className="mt-2 space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                          {assessment.precautions.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          Suitable Indoor / Routine Alternatives
                        </p>
                        <ul className="mt-2 space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                          {assessment.indoorAlternatives.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
