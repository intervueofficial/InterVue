import { useEffect, useState } from "react";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserCog,
  Bell,
  SlidersHorizontal,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Construction,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader";
import { THEME } from "../../constants/theme";
import { adminApi } from "../../api/adminApi";

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
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className="relative flex-shrink-0 transition-colors"
      style={{
        width: 42,
        height: 24,
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        padding: 0,
        background: checked ? THEME.ink : THEME.border,
      }}
    >
      <span
        className="absolute rounded-full transition-transform"
        style={{
          top: 3,
          left: 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: THEME.surface,
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          transitionDuration: "0.2s",
        }}
      />
    </button>
  );
};

const SectionCard = ({ icon: Icon, color, title, subtitle, badge, children }) => {
  return (
    <div
      className="rounded-xl p-6 transition-colors"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = THEME.borderStrong)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = THEME.border)}
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: THEME.surface2 }}
          >
            <Icon color={color} size={19} />
          </div>

          <div className="min-w-0">
            <div
              className="truncate"
              style={{ fontFamily: THEME.fontDisplay, fontSize: 15, fontWeight: 600, color: THEME.ink }}
            >
              {title}
            </div>
            {subtitle && (
              <div className="text-xs mt-0.5 truncate" style={{ color: THEME.inkFaint }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {badge}
      </div>

      {children}
    </div>
  );
};

const SettingsRow = ({ label, description, control }) => (
  <div
    className="flex items-center justify-between gap-4 py-3.5 first:pt-0"
    style={{ borderTop: `1px solid ${THEME.border}` }}
  >
    <div className="min-w-0">
      <div className="text-sm font-semibold" style={{ color: THEME.ink }}>{label}</div>
      {description && (
        <div className="text-xs mt-0.5" style={{ color: THEME.inkFaint }}>{description}</div>
      )}
    </div>
    {control}
  </div>
);

const inputStyle = {
  borderRadius: 8,
  border: `1px solid ${THEME.border}`,
  background: THEME.background,
  color: THEME.ink,
  padding: "8px 12px",
  fontSize: 13,
  outline: "none",
};

const btnSecondary =
  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors";

const Settings = () => {
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // ── Maintenance Mode — the one Platform Preference that's actually
  // wired to the backend. Kept separate from the browser-only settings
  // above so it can have its own real save state instead of piggy-
  // backing on the "saved to your browser" flow. ──────────────────────
  const { data: platformSettingsData } = useQuery({
    queryKey: ["admin-platform-settings"],
    queryFn: async () => adminApi.getPlatformSettings(await getToken()),
  });

  const liveSettings = platformSettingsData?.settings;

  const [maintenanceDraft, setMaintenanceDraft] = useState(null);

  useEffect(() => {
    if (liveSettings && maintenanceDraft === null) {
      setMaintenanceDraft({
        maintenanceMode: liveSettings.maintenanceMode,
        maintenanceMessage: liveSettings.maintenanceMessage,
      });
    }
  }, [liveSettings, maintenanceDraft]);

  const maintenanceMutation = useMutation({
    mutationFn: async (payload) =>
      adminApi.updatePlatformSettings(payload, await getToken()),
    onSuccess: (data) => {
      toast.success(
        data.settings.maintenanceMode
          ? "Maintenance mode is now ON — candidates are blocked."
          : "Maintenance mode is now off."
      );
      queryClient.invalidateQueries({ queryKey: ["admin-platform-settings"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update maintenance mode.");
    },
  });

  const handleMaintenanceToggle = (checked) => {
    setMaintenanceDraft((prev) => ({ ...prev, maintenanceMode: checked }));
    maintenanceMutation.mutate({
      maintenanceMode: checked,
      maintenanceMessage: maintenanceDraft?.maintenanceMessage,
    });
  };

  const handleMaintenanceMessageSave = () => {
    maintenanceMutation.mutate({
      maintenanceMode: maintenanceDraft?.maintenanceMode,
      maintenanceMessage: maintenanceDraft?.maintenanceMessage,
    });
  };

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
      toast.success("Preferences saved on this device.");
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
      <PageHeader
        eyebrow="Insights"
        title="Settings"
        description="Manage your admin profile, notifications, and platform preferences."
        actions={
          <>
            <button
              onClick={handleReset}
              className={btnSecondary}
              style={{ border: `1px solid ${THEME.border}`, color: THEME.inkMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <RotateCcw size={14} />
              Reset
            </button>

            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="flex items-center gap-2 rounded-lg font-semibold text-sm px-4 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: THEME.ink, color: THEME.surface }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) e.currentTarget.style.opacity = "0.88";
              }}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Save size={15} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Admin Profile */}
        <SectionCard icon={UserCog} color={THEME.primary} title="Admin Profile" subtitle="Your account information">
          <div className="flex items-center gap-3.5">
            <img
              src={user?.imageUrl}
              alt={user?.fullName || "Admin"}
              className="w-14 h-14 rounded-xl object-cover"
              style={{ border: `1px solid ${THEME.border}` }}
            />

            <div className="min-w-0">
              <div className="font-semibold truncate text-sm" style={{ color: THEME.ink }}>
                {user?.fullName || "Administrator"}
              </div>
              <div className="text-xs truncate" style={{ color: THEME.inkFaint }}>
                {user?.primaryEmailAddress?.emailAddress}
              </div>
              <span
                className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: THEME.primaryTint, color: THEME.primary, boxShadow: `inset 0 0 0 1px ${THEME.primaryTintBorder}` }}
              >
                Administrator
              </span>
            </div>
          </div>

          <button
            onClick={() => openUserProfile()}
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ border: `1px solid ${THEME.border}`, color: THEME.ink }}
            onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Manage Account
            <ExternalLink size={14} />
          </button>
        </SectionCard>

        {/* Security */}
        <SectionCard icon={ShieldCheck} color={THEME.success} title="Security" subtitle="Protect your admin access">
          <SettingsRow
            label="Password & Authentication"
            description="Update your password or enable two-factor authentication"
            control={
              <button
                onClick={() => openUserProfile()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ border: `1px solid ${THEME.border}`, color: THEME.ink }}
                onMouseEnter={(e) => (e.currentTarget.style.background = THEME.surface2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ border: `1px solid ${THEME.dangerBorder}`, color: THEME.danger }}
                onMouseEnter={(e) => (e.currentTarget.style.background = THEME.dangerTint)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut size={13} />
                Sign Out
              </button>
            }
          />
        </SectionCard>

        {/* Notifications */}
        <SectionCard
          icon={Bell}
          color={THEME.warning}
          title="Notifications"
          subtitle="Choose what you want to be notified about"
          badge={
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ background: THEME.surface2, color: THEME.inkFaint }}
              title="Stored on this device only — not yet sent to the backend"
            >
              This device
            </span>
          }
        >
          <SettingsRow
            label="Email Alerts"
            description="Get important platform alerts via email"
            control={<Toggle checked={settings.notifications.emailAlerts} onChange={(v) => updateNotification("emailAlerts", v)} />}
          />
          <SettingsRow
            label="New User Alerts"
            description="Notify me when a new user registers"
            control={<Toggle checked={settings.notifications.newUserAlerts} onChange={(v) => updateNotification("newUserAlerts", v)} />}
          />
          <SettingsRow
            label="Session Reminders"
            description="Remind me before scheduled interview sessions"
            control={<Toggle checked={settings.notifications.sessionReminders} onChange={(v) => updateNotification("sessionReminders", v)} />}
          />
          <SettingsRow
            label="Weekly Reports"
            description="Receive a weekly platform analytics summary"
            control={<Toggle checked={settings.notifications.weeklyReports} onChange={(v) => updateNotification("weeklyReports", v)} />}
          />
        </SectionCard>

        {/* Platform Preferences */}
        <SectionCard
          icon={SlidersHorizontal}
          color="#7C3AED"
          title="Platform Preferences"
          subtitle="Configure default platform behavior"
          badge={
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0"
              style={{ background: THEME.dangerTint, color: THEME.danger }}
              title="Not wired to the backend yet — see note below"
            >
              <AlertTriangle size={10} />
              Not enforced
            </span>
          }
        >
          <div
            className="flex items-start gap-2 rounded-lg px-3.5 py-3 mb-1 text-xs"
            style={{ background: THEME.dangerTint, color: THEME.danger, border: `1px solid ${THEME.dangerBorder}` }}
          >
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
            <span>
              These currently save to your browser only. Session creation, interviewer
              sign-up, and platform access don't read them yet — treat them as drafts
              until a backend settings endpoint exists.
            </span>
          </div>

          <SettingsRow
            label="Default Session Duration"
            description="Suggested duration when creating new interview sessions"
            control={
              <div className="relative">
                <Calendar
                  size={14}
                  color={THEME.inkFaint}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <select
                  value={settings.platform.defaultSessionDuration}
                  onChange={(e) => updatePlatform("defaultSessionDuration", e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 30 }}
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>
            }
          />

          <SettingsRow
            label="Auto-approve Interviewers"
            description="Skip manual review for new interviewer sign-ups"
            control={<Toggle checked={settings.platform.autoApproveInterviewers} onChange={(v) => updatePlatform("autoApproveInterviewers", v)} />}
          />
        </SectionCard>

        {/* Maintenance Mode — real, backend-enforced */}
        <SectionCard
          icon={Construction}
          color={maintenanceDraft?.maintenanceMode ? THEME.danger : THEME.success}
          title="Maintenance Mode"
          subtitle="Block candidate access to the platform"
          badge={
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0"
              style={{ background: THEME.successTint, color: THEME.success }}
              title="Actually enforced server-side by middleware — unlike Platform Preferences above"
            >
              <CheckCircle2 size={10} />
              Enforced
            </span>
          }
        >
          <SettingsRow
            label="Maintenance Mode"
            description={
              maintenanceDraft?.maintenanceMode
                ? "ON — candidates currently can't browse jobs, apply, or join sessions."
                : "OFF — candidates have normal access."
            }
            control={
              <Toggle
                checked={!!maintenanceDraft?.maintenanceMode}
                onChange={handleMaintenanceToggle}
              />
            }
          />

          <div>
            <label className="text-sm font-semibold block mb-1.5" style={{ color: THEME.ink }}>
              Message shown to blocked candidates
            </label>
            <textarea
              value={maintenanceDraft?.maintenanceMessage || ""}
              onChange={(e) =>
                setMaintenanceDraft((prev) => ({ ...prev, maintenanceMessage: e.target.value }))
              }
              rows={2}
              className="w-full text-sm"
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <button
              type="button"
              onClick={handleMaintenanceMessageSave}
              disabled={maintenanceMutation.isPending}
              className={`${btnSecondary} mt-2`}
              style={{ background: THEME.surface2, color: THEME.ink }}
            >
              <Save size={14} />
              Save message
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default Settings;
