import React, { useEffect, useState } from "react";
import { fetchProfile, saveProfile } from "../api";

const US_STATES = [
  ["", "Select state"],
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["DC", "District of Columbia"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
];

const AGE_OPTIONS = [
  ["", "Select age range"],
  ["18_24", "18-24"],
  ["25_30", "25-30"],
  ["31_40", "31-40"],
  ["40_plus", "40+"],
];

const EMPLOYMENT_OPTIONS = [
  ["", "Select employment type"],
  ["full_time_salaried", "Full-time salaried"],
  ["part_time_hourly", "Part-time or hourly"],
  ["freelance_gig", "Freelance or gig"],
  ["student", "Student"],
  ["between_jobs", "Between jobs"],
];

const LIVING_OPTIONS = [
  ["", "Select living situation"],
  ["single", "Single"],
  ["partnered", "Partnered"],
  ["family_kids", "Family with kids"],
  ["supporting_abroad", "Supporting family abroad"],
];

const FAMILY_OPTIONS = [
  ["", "Select family situation"],
  ["no_dependents", "No dependents"],
  ["have_children", "Have children"],
  ["caring_parents", "Caring for parents or family members"],
  ["both", "Both"],
];

const optionLabel = (options, value) =>
  options.find(([val]) => val === value)?.[1] || "Not set";

const profileRows = (form) => [
  ["Full Name", form.full_name || "Not set"],
  ["Age Group", optionLabel(AGE_OPTIONS, form.age_range)],
  ["State", optionLabel(US_STATES, form.state)],
  ["Employment Type", optionLabel(EMPLOYMENT_OPTIONS, form.employment_type)],
  ["Living Situation", optionLabel(LIVING_OPTIONS, form.living_situation)],
  ["Family Situation", optionLabel(FAMILY_OPTIONS, form.family_situation)],
];

const isProfileComplete = (form) =>
  Boolean(
    form.full_name.trim() &&
      form.age_range &&
      form.state &&
      form.employment_type &&
      form.living_situation &&
      form.family_situation
  );

export default function Profile({ onProfileSaved }) {
  const [form, setForm] = useState({
    full_name: "",
    age_range: "",
    state: "",
    employment_type: "",
    living_situation: "",
    family_situation: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedMsg, setSavedMsg] = useState(null);
  const [situationNote, setSituationNote] = useState(null);
  const [editMode, setEditMode] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchProfile()
      .then(({ data }) => {
        const nextForm = {
          full_name: data.full_name || "",
          age_range: data.age_range || "",
          state: data.state || "",
          employment_type: data.employment_type || "",
          living_situation: data.living_situation || "",
          family_situation: data.family_situation || "",
        };
        setForm(nextForm);
        setEditMode(data.incomplete ?? !isProfileComplete(nextForm));
      })
      .catch(() => setError("Could not load profile."))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field) => (e) => {
    const v = e.target.value;
    setForm((prev) => ({ ...prev, [field]: v }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    setSituationNote(null);
    saveProfile(form)
      .then(({ data }) => {
        const nextForm = {
          full_name: data.full_name || "",
          age_range: data.age_range || "",
          state: data.state || "",
          employment_type: data.employment_type || "",
          living_situation: data.living_situation || "",
          family_situation: data.family_situation || "",
        };
        setForm(nextForm);
        setSavedMsg("Profile saved.");
        if (onProfileSaved) onProfileSaved(data);
        if (data.situation_changed && data.situation_message) {
          setSituationNote(data.situation_message);
        }
        setEditMode(data.incomplete ?? !isProfileComplete(nextForm));
      })
      .catch((err) => {
        const d = err.response?.data;
        if (d && typeof d === "object") {
          const first = Object.entries(d)[0];
          const msg = first ? `${first[0]}: ${Array.isArray(first[1]) ? first[1][0] : first[1]}` : "Save failed.";
          setError(msg);
        } else {
          setError("Could not save profile.");
        }
      })
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="form-card profile-card">
        <p style={{ color: "#5A5A5A" }}>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="form-card profile-card">
      <h1 className="onboarding-title" style={{ marginBottom: "0.5rem" }}>
        Your Profile
      </h1>
      <p className="onboarding-sub">
        Saves to your account. We use this to tailor questions (for example skipping income-stability
        prompts when you&apos;re salaried) and wording in your action plan.
      </p>

      {!editMode && (
        <div className="profile-summary">
          {profileRows(form).map(([label, value]) => (
            <div className="profile-summary-row" key={label}>
              <span>{label}:</span>
              <strong>{value}</strong>
            </div>
          ))}

          {savedMsg && <p className="profile-success">{savedMsg}</p>}
          {situationNote && <p className="profile-retake-banner">{situationNote}</p>}

          <button className="btn-secondary profile-edit" type="button" onClick={() => setEditMode(true)}>
            Edit profile
          </button>
        </div>
      )}

      {editMode && (
      <form className="profile-form" onSubmit={handleSubmit}>
        <label className="profile-label">
          Full name
          <input
            className="profile-input"
            type="text"
            value={form.full_name}
            onChange={handleChange("full_name")}
            autoComplete="name"
            placeholder={"Name as you'd like it shown"}
          />
        </label>

        <label className="profile-label">
          Age range
          <select className="profile-input" value={form.age_range} onChange={handleChange("age_range")}>
            {AGE_OPTIONS.map(([val, lab]) => (
              <option key={val || "empty-age"} value={val}>
                {lab}
              </option>
            ))}
          </select>
        </label>

        <label className="profile-label">
          State
          <select className="profile-input" value={form.state} onChange={handleChange("state")}>
            {US_STATES.map(([val, lab]) => (
              <option key={val || "empty-st"} value={val}>
                {lab}
              </option>
            ))}
          </select>
        </label>

        <label className="profile-label">
          Employment type
          <select className="profile-input" value={form.employment_type} onChange={handleChange("employment_type")}>
            {EMPLOYMENT_OPTIONS.map(([val, lab]) => (
              <option key={val || "empty-emp"} value={val}>
                {lab}
              </option>
            ))}
          </select>
        </label>

        <label className="profile-label">
          Living situation
          <select className="profile-input" value={form.living_situation} onChange={handleChange("living_situation")}>
            {LIVING_OPTIONS.map(([val, lab]) => (
              <option key={val || "empty-liv"} value={val}>
                {lab}
              </option>
            ))}
          </select>
        </label>

        <label className="profile-label">
          Family situation
          <select className="profile-input" value={form.family_situation} onChange={handleChange("family_situation")}>
            {FAMILY_OPTIONS.map(([val, lab]) => (
              <option key={val || "empty-fam"} value={val}>
                {lab}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="error-msg">{error}</p>}
        {savedMsg && <p className="profile-success">{savedMsg}</p>}
        {situationNote && <p className="profile-retake-banner">{situationNote}</p>}

        <button className="btn-primary profile-save" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
      )}
    </div>
  );
}
