import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import {
  UserCog,
  Bell,
  SlidersHorizontal,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Save,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";

const STORAGE_KEY = "intervue-admin-settings";

const DEFAULT_SETTINGS = {
  notifications: {
    emailAlerts: true,
    newUserAlerts: true,
    sessionReminders: true,
    weeklyReports: false,
  },
  platform: {
    defaultSessionDuration: "60",
    maintenanceMode: false,
    autoApproveInterviewers: false,
  },
};

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw);

    return {
      notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
      platform: { ...DEFAULT_SETTINGS.platform, ...parsed.platform },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const Toggle = ({ checked, onChange }) => {
  return (
    <>
      <style>{`
        .toggle{
          width:46px;
          height:26px;
          border-radius:99px;
          border:none;
          cursor:pointer;
          position:relative;
          flex-shrink:0;
          transition:background .2s ease;
          padding:0;
        }

        .toggle-knob{
          position:absolute;
          top:3px;
          left:3px;
          width:20px;
          height:20px;
          border-radius:50%;
          background:#fff;
          box-shadow:0 1px 3px rgba(15,23,42,.3);
          transition:transform .2s cubic-bezier(.4,0,.2,1);
        }
      `}</style>

      <button
        type="button"
        className="toggle"
        onClick={() => onChange(!checked)}
        style={{ background: checked ? "#2563EB" : "#CBD5E1" }}
        aria-pressed={checked}
      >
        <span
          className="toggle-knob"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    </>
  );
};

const SectionCard = ({ icon: Icon, color, title, subtitle, children }) => {
  return (
    <>
      <style>{`
        .settings-card{
          background:#fff;
          border:1px solid #E2E8F0;
          border-radius:22px;
          padding:26px;
          transition:.25s;
        }

        .settings-card:hover{
          box-shadow:0 20px 45px rgba(15,23,42,.06);
          border-color:#CBD5E1;
        }

        .settings-card-header{
          display:flex;
          align-items:center;
          gap:14px;
          margin-bottom:22px;
        }

        .settings-icon-box{
          width:46px;
          height:46px;
          min-width:46px;
          border-radius:14px;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .settings-card-title{
          font-size:17px;
          font-weight:700;
          color:#0F172A;
        }

        .settings-card-subtitle{
          font-size:13px;
          color:#94A3B8;
          margin-top:2px;
        }

        .settings-row{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          padding:14px 0;
          border-top:1px solid #F1F5F9;
        }

        .settings-row:first-of-type{
          border-top:none;
          padding-top:0;
        }

        .settings-row-label{
          font-size:14.5px;
          font-weight:600;
          color:#334155;
        }

        .settings-row-desc{
          font-size:13px;
          color:#94A3B8;
          margin-top:2px;
        }
      `}</style>

      <div className="settings-card">
        <div className="settings-card-header">
          <div
            className="settings-icon-box"
            style={{ background: `${color}15` }}
          >
            <Icon color={color} size={22} />
          </div>

          <div>
            <div className="settings-card-title">{title}</div>
            {subtitle && (
              <div className="settings-card-subtitle">{subtitle}</div>
            )}
          </div>
        </div>

        {children}
      </div>
    </>
  );
};

const SettingsRow = ({ label, description, control }) => (
  <div className="settings-row">
    <div>
      <div className="settings-row-label">{label}</div>
      {description && (
        <div className="settings-row-desc">{description}</div>
      )}
    </div>
    {control}
  </div>
);

const inputStyle =
  "rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const Settings = () => {
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const updateNotification = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
    setDirty(true);
  };

  const updatePlatform = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      platform: { ...prev.platform, [key]: value },
    }));
    setDirty(true);
  };

  const handleSave = () => {
    setSaving(true);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast.success("Settings saved successfully.");
      setDirty(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setDirty(true);
    toast("Reset to default values. Click Save to apply.", { icon: "↩️" });
  };

  const handleSignOutEverywhere = async () => {
    const confirmed = window.confirm(
      "This will sign you out on this device. Continue?"
    );

    if (!confirmed) return;

    await signOut();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1
            className="text-4xl font-bold"
            style={{ color: "#2563EB", letterSpacing: "-0.5px" }}
          >
            Settings
          </h1>
          <p className="text-slate-500 mt-2">
            Manage your admin profile, notifications, and platform preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Admin Profile */}
        <SectionCard
          icon={UserCog}
          color="#2563EB"
          title="Admin Profile"
          subtitle="Your account information"
        >
          <div className="flex items-center gap-4">
            <img
              src={user?.imageUrl}
              alt={user?.fullName || "Admin"}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
            />

            <div className="min-w-0">
              <div className="font-bold text-slate-900 truncate">
                {user?.fullName || "Administrator"}
              </div>
              <div className="text-sm text-slate-500 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </div>
              <span
                className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: "#2563EB15", color: "#2563EB" }}
              >
                Administrator
              </span>
            </div>
          </div>

          <button
            onClick={() => openUserProfile()}
            className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 transition font-medium text-slate-700"
          >
            Manage Account
            <ExternalLink size={16} />
          </button>
        </SectionCard>

        {/* Security */}
        <SectionCard
          icon={ShieldCheck}
          color="#15803D"
          title="Security"
          subtitle="Protect your admin access"
        >
          <SettingsRow
            label="Password & Authentication"
            description="Update your password or enable two-factor authentication"
            control={
              <button
                onClick={() => openUserProfile()}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 transition text-sm font-medium text-slate-700"
              >
                Manage
              </button>
            }
          />

          <SettingsRow
            label="Sign Out"
            description="Sign out of your admin session on this device"
            control={
              <button
                onClick={handleSignOutEverywhere}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition text-sm font-medium"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            }
          />
        </SectionCard>

        {/* Notifications */}
        <SectionCard
          icon={Bell}
          color="#B45309"
          title="Notifications"
          subtitle="Choose what you want to be notified about"
        >
          <SettingsRow
            label="Email Alerts"
            description="Get important platform alerts via email"
            control={
              <Toggle
                checked={settings.notifications.emailAlerts}
                onChange={(v) => updateNotification("emailAlerts", v)}
              />
            }
          />

          <SettingsRow
            label="New User Alerts"
            description="Notify me when a new user registers"
            control={
              <Toggle
                checked={settings.notifications.newUserAlerts}
                onChange={(v) => updateNotification("newUserAlerts", v)}
              />
            }
          />

          <SettingsRow
            label="Session Reminders"
            description="Remind me before scheduled interview sessions"
            control={
              <Toggle
                checked={settings.notifications.sessionReminders}
                onChange={(v) => updateNotification("sessionReminders", v)}
              />
            }
          />

          <SettingsRow
            label="Weekly Reports"
            description="Receive a weekly platform analytics summary"
            control={
              <Toggle
                checked={settings.notifications.weeklyReports}
                onChange={(v) => updateNotification("weeklyReports", v)}
              />
            }
          />
        </SectionCard>

        {/* Platform Preferences */}
        <SectionCard
          icon={SlidersHorizontal}
          color="#7C3AED"
          title="Platform Preferences"
          subtitle="Configure default platform behavior"
        >
          <SettingsRow
            label="Default Session Duration"
            description="Applied when creating new interview sessions"
            control={
              <select
                value={settings.platform.defaultSessionDuration}
                onChange={(e) =>
                  updatePlatform("defaultSessionDuration", e.target.value)
                }
                className={inputStyle}
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            }
          />

          <SettingsRow
            label="Auto-approve Interviewers"
            description="Skip manual review for new interviewer sign-ups"
            control={
              <Toggle
                checked={settings.platform.autoApproveInterviewers}
                onChange={(v) => updatePlatform("autoApproveInterviewers", v)}
              />
            }
          />

          <SettingsRow
            label="Maintenance Mode"
            description="Temporarily block candidate access to the platform"
            control={
              <Toggle
                checked={settings.platform.maintenanceMode}
                onChange={(v) => updatePlatform("maintenanceMode", v)}
              />
            }
          />
        </SectionCard>
      </div>
    </div>
  );
};

export default Settings;