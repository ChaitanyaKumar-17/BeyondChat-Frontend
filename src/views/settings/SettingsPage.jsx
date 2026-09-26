import { useState, useRef, useCallback } from 'react';
import { Home, Users, Phone, Send, Smile, X, Play, Palette, Volume2, LogOut, Reply, Forward, Timer, Shield, Eye, AtSign, Sparkles, Circle, CheckCircle, UserCheck, AlertCircle, Camera, Bell, Moon, Database, HelpCircle, ShieldCheck, MessageSquare } from 'lucide-react';
import { containsProfanity } from '@/utils/profanity';
import { playNotificationTone } from '@/utils/audio';
import { DEFAULT_SETTINGS } from '@/constants/settings';
import SubHeader from '@/components/common/SubHeader';
import SettingsRow from '@/components/common/SettingsRow';
import FAQItem from '@/components/common/FAQItem';
import StorageScreen from '@/views/settings/StorageScreen';

export default function SettingsPage({ currentUser, onUpdateUser, userSettings, onUpdateSetting, blockedUsers = [], onUnblock, chatDetails = [], setChatDetails, onToast, onSubScreenChange }) {

  const [subScreen, setSubScreen] = useState(null);
  const [isEntering, setIsEntering] = useState(false); // new screen slides in
  const [isLeaving,  setIsLeaving]  = useState(false); // current screen slides out

  // Animated navigation — both enter and exit transitions
  const navigateTo = useCallback((screen) => {
    if (screen === subScreen) return;

    if (screen) {
      // Forward: mount new screen (CSS animation plays on mount)
      setSubScreen(screen);
      onSubScreenChange?.(true);
    } else {
      // Back: animate current screen out, then unmount
      setIsLeaving(true);
      setTimeout(() => {
        setSubScreen(null);
        setIsLeaving(false);
        onSubScreenChange?.(false);
      }, 200);
    }
  }, [subScreen]);

  const [profileDraft, setProfileDraft] = useState({ ...currentUser });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [customWord, setCustomWord]      = useState('');
  const fileInputRef = useRef(null);

  const STATUS_OPTIONS = [
    { value: 'Online',    color: 'bg-emerald-500', label: 'Online' },
    { value: 'Away',      color: 'bg-amber-500',   label: 'Away' },
    { value: 'Busy',      color: 'bg-red-500',     label: 'Busy' },
    { value: 'Invisible', color: 'bg-zinc-500',    label: 'Invisible' },
  ];

  const FILTER_MODES = [
    { value: 'block',    label: 'Block',    desc: 'Message cannot be sent',            color: 'text-red-400' },
    { value: 'warn',     label: 'Warn',     desc: 'Show warning, allow after confirm', color: 'text-amber-400' },
    { value: 'sanitize', label: 'Sanitize', desc: 'Auto-replace flagged words with ***', color: 'text-blue-400' },
    { value: 'off',      label: 'Off',      desc: 'No filtering applied',              color: 'text-zinc-400' },
  ];

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfileDraft(d => ({ ...d, avatar: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    const name = profileDraft.name.trim();
    const handle = profileDraft.handle.trim();
    const about = (profileDraft.about || '').trim();
    if (!name) { setProfileError('Name cannot be empty.'); return; }
    const _profileFilterOpts = { leetDetection: userSettings.safety?.leetDetection !== false, customBlocklist: userSettings.safety?.customBlocklist || [] };
    if (containsProfanity(name, _profileFilterOpts) || containsProfanity(about, _profileFilterOpts) || containsProfanity(handle, _profileFilterOpts)) {
      setProfileError('Inappropriate language detected. Please revise.'); return;
    }
    setProfileError('');
    onUpdateUser({ ...profileDraft, name, handle, about });
    navigateTo(null);
  };

  const addCustomWord = () => {
    const w = customWord.trim().toLowerCase();
    if (!w) return;
    const list = userSettings.safety.customBlocklist || [];
    if (!list.includes(w)) onUpdateSetting('safety', 'customBlocklist', [...list, w]);
    setCustomWord('');
  };

  const removeCustomWord = (word) => {
    onUpdateSetting('safety', 'customBlocklist', (userSettings.safety.customBlocklist || []).filter(w => w !== word));
  };

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-indigo-500' : 'bg-zinc-700'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );


  // Profile sub-screen

  if (subScreen === 'profile') return (
    <div className={`flex flex-col h-full bg-[#0f0f13] ${
      isLeaving ? 'settings-subscreen-out' : 'settings-subscreen'
    }`}>
      <SubHeader title="Edit Profile" onBack={() => { setProfileDraft({ ...currentUser }); setProfileError(''); navigateTo(null); }} />
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden p-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img src={profileDraft.avatar} alt="avatar" className="w-24 h-24 rounded-full object-cover ring-4 ring-white/[0.08]" />
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={22} className="text-white" />
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
          <button onClick={() => fileInputRef.current?.click()} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            Change Photo
          </button>
        </div>

        {[
          { label: 'Display Name', key: 'name', icon: <UserCheck size={14} />, placeholder: 'Your name', multiline: false },
          { label: 'Username', key: 'handle', icon: <AtSign size={14} />, placeholder: '@username', multiline: false },
          { label: 'About', key: 'about', icon: <MessageSquare size={14} />, placeholder: 'Say something about yourself', multiline: true },
        ].map(({ label, key, icon, placeholder, multiline }) => (
          <div key={key} className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">{icon} {label}</label>
            {multiline ? (
              <textarea
                value={profileDraft[key] || ''}
                onChange={e => setProfileDraft(d => ({ ...d, [key]: e.target.value }))}
                rows={3} maxLength={150} placeholder={placeholder}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50 resize-none"
              />
            ) : (
              <input
                value={profileDraft[key] || ''}
                onChange={e => setProfileDraft(d => ({ ...d, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50"
              />
            )}
          </div>
        ))}

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <Circle size={14} /> Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map(s => (
              <button key={s.value} onClick={() => setProfileDraft(d => ({ ...d, status: s.value }))}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all text-sm font-medium ${profileDraft.status === s.value ? 'border-indigo-500/50 bg-indigo-500/10 text-white' : 'border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06]'}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${s.color} flex-shrink-0`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {profileError && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle size={14} /> {profileError}
          </p>
        )}
      </div>
      <div className="p-5 border-t border-white/[0.05] flex-shrink-0">
        <button onClick={handleSaveProfile} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm">
          Save Changes
        </button>
      </div>
    </div>
  );

  // ─ Privacy & Security sub-screen ─
  if (subScreen === 'privacy') return (
    <div className={`flex flex-col h-full bg-[#0f0f13] ${
      isLeaving ? 'settings-subscreen-out' : 'settings-subscreen'
    }`}>
      <SubHeader title="Privacy & Security" onBack={() => navigateTo(null)} />
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden p-5 space-y-6">

        {/* Visibility */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Visibility</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
            {[
              { key: 'readReceipts',  label: 'Read Receipts',  desc: 'Let others know when you have read their messages', icon: <CheckCircle size={15} /> },
              { key: 'onlineStatus',  label: 'Online Status',   desc: 'Show when you are active in the app',              icon: <Eye size={15} /> },
            ].map(({ key, label, desc, icon }) => (
              <div key={key} className="flex items-center gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-xl bg-white/[0.07] text-zinc-300 flex items-center justify-center flex-shrink-0">{icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                </div>
                <Toggle
                  checked={userSettings.privacy[key] !== false}
                  onChange={v => onUpdateSetting('privacy', key, v)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Last Seen */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Last Seen & Online</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
            {[
              { value: 'everyone',  label: 'Everyone',      desc: 'All users can see your last seen' },
              { value: 'contacts',  label: 'My Contacts',   desc: 'Only people you have chatted with' },
              { value: 'nobody',    label: 'Nobody',        desc: 'No one can see your last seen' },
            ].map(m => (
              <button key={m.value} onClick={() => onUpdateSetting('privacy', 'lastSeen', m.value)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] transition-colors">
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${userSettings.privacy.lastSeen === m.value ? 'border-indigo-400 bg-indigo-400' : 'border-zinc-600'}`}>
                  {userSettings.privacy.lastSeen === m.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">{m.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-zinc-600 mt-2 px-1">If you don't share your Last Seen, you won't be able to see others' Last Seen either.</p>
        </div>

        {/* Disappearing Messages Default */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Default Message Timer</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
            {[
              { value: 'off',     label: 'Off',     desc: 'Messages are kept until manually deleted' },
              { value: 'session', label: 'Session',  desc: 'Deleted when you close the chat' },
              { value: '1day',    label: '1 Day',    desc: 'Auto-deleted after 24 hours' },
              { value: '1week',   label: '1 Week',   desc: 'Auto-deleted after 7 days' },
            ].map(m => (
              <button key={m.value} onClick={() => onUpdateSetting('privacy', 'defaultDisappearing', m.value)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] transition-colors">
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${(userSettings.privacy.defaultDisappearing || 'off') === m.value ? 'border-indigo-400 bg-indigo-400' : 'border-zinc-600'}`}>
                  {(userSettings.privacy.defaultDisappearing || 'off') === m.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">{m.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Blocked Users */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">
            Blocked Users {blockedUsers.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-zinc-700 rounded-full text-zinc-400 text-[10px]">{blockedUsers.length}</span>}
          </p>
          {blockedUsers.length === 0 ? (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] px-5 py-6 flex flex-col items-center gap-2">
              <Shield size={28} className="text-zinc-700" />
              <p className="text-sm text-zinc-500 text-center">No blocked users</p>
              <p className="text-xs text-zinc-600 text-center">Users you block will appear here</p>
            </div>
          ) : (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04] overflow-hidden">
              {blockedUsers.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {u.avatar
                      ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                      : <span className="text-sm font-bold text-white">{u.name?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{u.name}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{u.isGroup ? 'Group' : 'Contact'} · Blocked {new Date(u.blockedAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => onUnblock(u.id)}
                    className="flex-shrink-0 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            Object.entries(DEFAULT_SETTINGS.privacy).forEach(([k, v]) => onUpdateSetting('privacy', k, v));
            onToast?.('Privacy settings reset to defaults.');
          }}
          className="w-full py-3 rounded-2xl border border-white/[0.06] text-sm text-zinc-500 hover:text-zinc-300 hover:border-white/10 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );

  // ?? Storage sub-screen ??
  if (subScreen === 'storage') return (
    <StorageScreen
      chatDetails={chatDetails}
      onClearChat={(id) => {
        setChatDetails(prev => prev.map(c => c.id === id ? { ...c, messages: [] } : c));
        onToast?.('Chat history cleared.');
      }}
      onClearCache={() => onToast?.('Cache cleared.')}
      onBack={() => navigateTo(null)}
    />
  );

  // Content Filters sub-screen
  if (subScreen === 'safety') return (
    <div className={`flex flex-col h-full bg-[#0f0f13] ${
      isLeaving ? 'settings-subscreen-out' : 'settings-subscreen'
    }`}>
      <SubHeader title="Content Filters" onBack={() => navigateTo(null)} />
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden p-5 space-y-6">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Filter Mode</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] overflow-hidden divide-y divide-white/[0.04]">
            {FILTER_MODES.map(m => (
              <button key={m.value} onClick={() => onUpdateSetting('safety', 'profanityFilter', m.value)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] transition-colors">
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${userSettings.safety.profanityFilter === m.value ? 'border-indigo-400 bg-indigo-400' : 'border-zinc-600'}`}>
                  {userSettings.safety.profanityFilter === m.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-semibold ${m.color}`}>{m.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detection — greyed out when filter is Off */}
        {(() => {
          const filterOff = userSettings.safety?.profanityFilter === 'off';
          return (
            <div className={filterOff ? 'opacity-40 pointer-events-none select-none' : ''}>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">
                Detection
                {filterOff && <span className="ml-2 normal-case font-normal text-zinc-600">(disabled — filter is off)</span>}
              </p>
              <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Leet-speak Detection</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Catches h3ll0, @ss, etc.</p>
                  </div>
                  <Toggle
                    checked={!filterOff && userSettings.safety.leetDetection !== false}
                    onChange={v => { if (!filterOff) onUpdateSetting('safety', 'leetDetection', v); }}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Custom Blocked Words</p>
          <div className="flex gap-2 mb-3">
            <input value={customWord} onChange={e => setCustomWord(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomWord()} placeholder="Add a word..."
              className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50" />
            <button onClick={addCustomWord} className="px-4 py-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl text-sm font-semibold hover:bg-indigo-500/30 transition-colors">Add</button>
          </div>
          {(userSettings.safety.customBlocklist || []).length === 0 ? (
            <p className="text-xs text-zinc-600 px-1">No custom words added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(userSettings.safety.customBlocklist || []).map(w => (
                <span key={w} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-xs text-red-300">
                  {w}
                  <button onClick={() => removeCustomWord(w)} className="hover:text-red-200"><X size={11} /></button>
                </span>
              ))}
            </div>
          )}
          <p className="text-[11px] text-zinc-600 mt-3 px-1">Custom words respect the Filter Mode selected above.</p>
        </div>
      </div>
    </div>
  );

  // Notifications sub-screen
  if (subScreen === 'notifications') return (
    <div className={`flex flex-col h-full bg-[#0f0f13] ${
      isLeaving ? 'settings-subscreen-out' : 'settings-subscreen'
    }`}>
      <SubHeader title="Notifications" onBack={() => navigateTo(null)} />
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden p-5 space-y-6">

        {/* General toggles */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">General</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
            {[
              { key: 'inApp',   label: 'In-App Notifications', desc: 'Show toast banners inside the app', icon: <Bell size={15} /> },
              { key: 'preview', label: 'Message Preview',       desc: 'Show message text in notifications', icon: <Eye size={15} /> },
              { key: 'sound',   label: 'Notification Sound',    desc: 'Play a sound on new messages',       icon: <Volume2 size={15} /> },
            ].map(({ key, label, desc, icon }) => (
              <div key={key} className="flex items-center gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-xl bg-white/[0.07] text-zinc-300 flex items-center justify-center flex-shrink-0">{icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                </div>
                <Toggle checked={userSettings.notifications[key] !== false} onChange={v => onUpdateSetting('notifications', key, v)} />
              </div>
            ))}
          </div>
        </div>

        {/* Notification Tone picker */}
        {userSettings.notifications.sound !== false && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Notification Tone</p>
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
              {[
                { value: 'ping',   label: 'Ping',   desc: 'Short high-pitched beep' },
                { value: 'chime',  label: 'Chime',  desc: 'Soft melodic tone' },
                { value: 'pop',    label: 'Pop',    desc: 'Quick subtle pop' },
                { value: 'bubble', label: 'Bubble', desc: 'Light airy sound' },
              ].map(t => (
                <div key={t.value} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    (userSettings.notifications.tone || 'ping') === t.value ? 'border-indigo-400 bg-indigo-400' : 'border-zinc-600'
                  }`}>
                    {(userSettings.notifications.tone || 'ping') === t.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{t.label}</p>
                    <p className="text-xs text-zinc-500">{t.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playNotificationTone(t.value)}
                      className="p-1.5 text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/10 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Volume2 size={13} />
                    </button>
                    <button
                      onClick={() => onUpdateSetting('notifications', 'tone', t.value)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        (userSettings.notifications.tone || 'ping') === t.value
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white/[0.06] text-zinc-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {(userSettings.notifications.tone || 'ping') === t.value ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-Category */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Notify Me About</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
            {[
              { key: 'reactions',   label: 'Reactions',       desc: 'When someone reacts to your message',  icon: <Smile size={15} /> },
              { key: 'groupChats',  label: 'Group Messages',  desc: 'Messages sent in group conversations', icon: <Users size={15} /> },
              { key: 'calls',       label: 'Calls',           desc: 'Incoming voice and video calls',        icon: <Phone size={15} /> },
            ].map(({ key, label, desc, icon }) => (
              <div key={key} className="flex items-center gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-xl bg-white/[0.07] text-zinc-300 flex items-center justify-center flex-shrink-0">{icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                </div>
                <Toggle
                  checked={userSettings.notifications[key] !== false}
                  onChange={v => onUpdateSetting('notifications', key, v)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Do Not Disturb */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Do Not Disturb</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-8 h-8 rounded-xl bg-white/[0.07] text-zinc-300 flex items-center justify-center flex-shrink-0"><Moon size={15} /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Do Not Disturb</p>
                <p className="text-xs text-zinc-500 mt-0.5">Silence all notifications during set hours</p>
              </div>
              <Toggle
                checked={userSettings.notifications.dnd?.enabled === true}
                onChange={v => onUpdateSetting('notifications', 'dnd', { ...(userSettings.notifications.dnd || {}), enabled: v })}
              />
            </div>

            {userSettings.notifications.dnd?.enabled && (
              <>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-8 h-8 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-zinc-400 mb-1">From</p>
                    <input
                      type="time"
                      value={userSettings.notifications.dnd?.from || '22:00'}
                      onChange={e => onUpdateSetting('notifications', 'dnd', { ...(userSettings.notifications.dnd || {}), from: e.target.value })}
                      className="bg-white/[0.06] border border-white/10 text-white text-sm rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-zinc-400 mb-1">To</p>
                    <input
                      type="time"
                      value={userSettings.notifications.dnd?.to || '08:00'}
                      onChange={e => onUpdateSetting('notifications', 'dnd', { ...(userSettings.notifications.dnd || {}), to: e.target.value })}
                      className="bg-white/[0.06] border border-white/10 text-white text-sm rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="px-5 py-3 bg-indigo-500/[0.06] flex items-center gap-2">
                  <Moon size={13} className="text-indigo-400 flex-shrink-0" />
                  <p className="text-xs text-indigo-300">
                    DND active {userSettings.notifications.dnd.from} - {userSettings.notifications.dnd.to}.
                    Notifications will be silenced during these hours.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            Object.entries(DEFAULT_SETTINGS.notifications).forEach(([k, v]) => onUpdateSetting('notifications', k, v));
            onToast?.('Notification settings reset to defaults.');
          }}
          className="w-full py-3 rounded-2xl border border-white/[0.06] text-sm text-zinc-500 hover:text-zinc-300 hover:border-white/10 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );

  // ?? Appearance sub-screen ??
  if (subScreen === 'appearance') return (
    <div className={`flex flex-col h-full bg-[var(--app-bg-panel,#0f0f13)] ${
      isLeaving ? 'settings-subscreen-out' : 'settings-subscreen'
    }`}>
      <SubHeader title="Appearance" onBack={() => navigateTo(null)} />
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden p-5 space-y-6">

        {/* Theme */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Theme</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'dark',     label: 'Dark',     bg: '#0a0a0c', secondary: '#1a1a1e', preview: '#18181b' },
              { value: 'darker',   label: 'Darker',   bg: '#050507', secondary: '#0f0f11', preview: '#0a0a0c' },
              { value: 'midnight', label: 'Midnight', bg: '#0d0d1a', secondary: '#12122a', preview: '#17173a' },
              { value: 'slate',    label: 'Slate',    bg: '#0c0e12', secondary: '#141720', preview: '#1a1d26' },
            ].map(th => {
              const isActive = (userSettings.appearance.theme || 'dark') === th.value;
              return (
                <button key={th.value} onClick={() => onUpdateSetting('appearance', 'theme', th.value)}
                  className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                    isActive ? 'border-[var(--app-accent,#6366f1)] scale-[1.02]' : 'border-white/[0.06] hover:border-white/20'
                  }`}>
                  {/* Mini preview */}
                  <div className="h-20" style={{ background: th.bg }}>
                    <div className="h-5 w-full" style={{ background: th.secondary }} />
                    <div className="flex gap-1.5 p-2">
                      <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: th.preview }} />
                      <div className="flex-1 space-y-1 pt-1">
                        <div className="h-2 rounded-full w-3/4" style={{ background: th.preview }} />
                        <div className="h-1.5 rounded-full w-1/2" style={{ background: th.preview }} />
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-2 flex items-center justify-between ${
                    isActive ? 'bg-[var(--app-accent,#6366f1)]' : 'bg-white/[0.04]'
                  }`}>
                    <span className="text-xs font-medium text-white">{th.label}</span>
                    {isActive && <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-[var(--app-accent,#6366f1)]" /></div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Accent Color</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] p-5">
            <div className="grid grid-cols-8 gap-2.5 mb-4">
              {[
                '#6366f1','#8b5cf6','#ec4899','#f43f5e',
                '#f97316','#eab308','#22c55e','#06b6d4',
              ].map(color => {
                const isActive = userSettings.appearance.accentColor === color;
                return (
                  <button key={color} onClick={() => onUpdateSetting('appearance', 'accentColor', color)}
                    className={`w-8 h-8 rounded-full transition-all border-2 ${
                      isActive ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ background: color }}
                    title={color}
                  >
                    {isActive && <div className="w-full h-full rounded-full flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-white/80" /></div>}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-zinc-500 flex-shrink-0">Custom</p>
              <div className="flex items-center gap-2 flex-1 bg-white/[0.05] rounded-xl px-3 py-2 border border-white/[0.06]">
                <input
                  type="color"
                  value={userSettings.appearance.accentColor || '#6366f1'}
                  onChange={e => onUpdateSetting('appearance', 'accentColor', e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-sm text-zinc-300 font-mono">{userSettings.appearance.accentColor || '#6366f1'}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-zinc-600 mt-2 px-1">Used for buttons, toggles, and selected states throughout the app.</p>
        </div>

        {/* Font Size */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Text Size</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
            {[
              { value: 'small',  label: 'Small',  sample: 'text-[13px]', desc: 'Compact ? fits more on screen' },
              { value: 'medium', label: 'Medium', sample: 'text-[15px]', desc: 'Default ? comfortable reading' },
              { value: 'large',  label: 'Large',  sample: 'text-[17px]', desc: 'Larger ? easier on the eyes' },
            ].map(fs => (
              <button key={fs.value} onClick={() => onUpdateSetting('appearance', 'fontSize', fs.value)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] transition-colors">
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  (userSettings.appearance.fontSize || 'medium') === fs.value ? 'border-[var(--app-accent,#6366f1)] bg-[var(--app-accent,#6366f1)]' : 'border-zinc-600'
                }`}>
                  {(userSettings.appearance.fontSize || 'medium') === fs.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex-1 text-left">
                  <span className={`font-medium text-white ${fs.sample}`}>{fs.label}</span>
                  <p className="text-xs text-zinc-500 mt-0.5">{fs.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bubble Style */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Message Bubble Style</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
            {[
              { value: 'default', label: 'Default', desc: 'Standard rounded chat bubbles', radius: 'rounded-2xl rounded-br-sm' },
              { value: 'rounded', label: 'Rounded', desc: 'Fully rounded pill-shaped bubbles', radius: 'rounded-full' },
              { value: 'minimal', label: 'Minimal', desc: 'Sharp corners, clean look', radius: 'rounded-lg' },
            ].map(bs => (
              <button key={bs.value} onClick={() => onUpdateSetting('appearance', 'bubbleStyle', bs.value)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] transition-colors">
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  (userSettings.appearance.bubbleStyle || 'default') === bs.value ? 'border-[var(--app-accent,#6366f1)] bg-[var(--app-accent,#6366f1)]' : 'border-zinc-600'
                }`}>
                  {(userSettings.appearance.bubbleStyle || 'default') === bs.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">{bs.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{bs.desc}</p>
                </div>
                {/* Mini bubble preview */}
                <div className={`px-3 py-1.5 text-[11px] text-white font-medium ${bs.radius}`}
                  style={{ background: userSettings.appearance.accentColor || '#6366f1', opacity: 0.85 }}>
                  Hello!
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live preview bar */}
        <div className="rounded-2xl border border-white/[0.05] p-4" style={{ background: 'var(--app-bg-secondary, #121214)' }}>
          <p className="text-xs text-zinc-500 mb-3 font-medium">Preview</p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-start">
              <div className={`px-3.5 py-2 text-sm text-white/90 max-w-[75%] ${
                { default: 'rounded-2xl rounded-bl-sm', rounded: 'rounded-full', minimal: 'rounded-lg' }[userSettings.appearance.bubbleStyle || 'default']
              }`} style={{ background: 'rgba(255,255,255,0.07)' }}>Hey! How's it going? 👋</div>
            </div>
            <div className="flex justify-end">
              <div className={`px-3.5 py-2 text-sm text-white max-w-[75%] ${
                { default: 'rounded-2xl rounded-br-sm', rounded: 'rounded-full', minimal: 'rounded-lg' }[userSettings.appearance.bubbleStyle || 'default']
              }`} style={{ background: userSettings.appearance.accentColor || '#6366f1' }}>All good! 😊</div>
            </div>
          </div>
        </div>

          <button
            onClick={() => {
              Object.entries(DEFAULT_SETTINGS.appearance).forEach(([k, v]) => onUpdateSetting('appearance', k, v));
              onToast?.('Appearance reset to defaults.');
            }}
            className="w-full py-3 rounded-2xl border border-white/[0.06] text-sm text-zinc-500 hover:text-zinc-300 hover:border-white/10 transition-colors"
          >
            Reset to Defaults
          </button>

      </div>
    </div>
  );

  // AI sub-screen
  if (subScreen === 'ai') return (
    <div className={`flex flex-col h-full bg-[#0f0f13] ${
      isLeaving ? 'settings-subscreen-out' : 'settings-subscreen'
    }`}>
      <SubHeader title="AI and Smart Replies" onBack={() => navigateTo(null)} />
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden p-5 space-y-4">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Smart Suggestions</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] divide-y divide-white/[0.04]">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Smart Reply Suggestions</p>
                <p className="text-xs text-zinc-500 mt-0.5">Show quick-reply chips based on incoming messages</p>
              </div>
              <Toggle checked={userSettings.ai.smartReplies !== false} onChange={v => onUpdateSetting('ai', 'smartReplies', v)} />
            </div>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">AI Writing Assistant</p>
                <p className="text-xs text-zinc-500 mt-0.5">Improve, shorten, or rephrase your messages with AI</p>
              </div>
              <Toggle checked={userSettings.ai.writingAssistant !== false} onChange={v => onUpdateSetting('ai', 'writingAssistant', v)} />
            </div>
          </div>
        </div>
        <p className="text-xs text-zinc-600 px-1">AI runs on-device. No messages are sent to external servers.</p>
      </div>
    </div>
  );

  // ?? Help & About sub-screen ??
  if (subScreen === 'help') return (
    <div className={`flex flex-col h-full bg-[#0f0f13] ${
      isLeaving ? 'settings-subscreen-out' : 'settings-subscreen'
    }`}>
      <SubHeader title="Help & About" onBack={() => navigateTo(null)} />
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden p-5 space-y-6">

        {/* App identity card */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] p-6 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <span className="text-2xl">💬</span>
          </div>
          <div className="text-center">
            <h2 className="text-base font-bold text-white">BeyondChat</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Version 1.0.0 - Build 2025.07</p>
          </div>
          <div className="flex gap-2 mt-1">
            {['Privacy Policy', 'Terms of Service'].map(label => (
              <button key={label} className="px-3 py-1.5 text-[11px] font-medium text-zinc-400 border border-white/[0.08] rounded-full hover:bg-white/[0.05] transition-colors">
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ accordion */}
        {[{
          q: 'How do I start a new chat?',
          a: 'Tap the compose icon in the top-right of the Home screen, then search for a contact to start a conversation.'
        }, {
          q: 'Can I delete a message after sending?',
          a: 'Yes, long-press any message you sent, then tap "Delete". You can delete for yourself or for everyone in the chat.'
        }, {
          q: 'What does disappearing messages do?',
          a: 'Disappearing messages automatically delete themselves after the configured timer. Once the session ends or the timer expires, messages are permanently removed.'
        }, {
          q: 'How do I block someone?',
          a: 'Open the chat with that person, tap their name at the top to open their profile, then tap "Block". Blocked users cannot send you messages or see your status.'
        }, {
          q: 'What is Do Not Disturb?',
          a: 'DND silences all notification sounds during a configured time window (e.g. 22:00-07:00). Notifications are still delivered but play no sound.'
        }].map(({ q, a }, i) => <FAQItem key={i} question={q} answer={a} />)}

        {/* Feedback */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-1">Send Feedback</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] p-4 space-y-3">
            <textarea
              rows={3}
              placeholder="Tell us what you think or report an issue…"
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none outline-none focus:border-indigo-500/50 transition-colors"
            />
            <button
              onClick={() => onToast?.('Feedback submitted ? thank you! ?')}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
            >
              Submit Feedback
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-700 pb-2">Made with ?? · BeyondChat © 2025</p>
      </div>
    </div>
  );

  // ?? Main settings menu ??
  const statusOption = STATUS_OPTIONS.find(s => s.value === currentUser.status) || STATUS_OPTIONS[0];
  return (
    <div className="relative flex flex-col h-full">
    <div className="flex flex-col flex-1 bg-[#0f0f13] overflow-y-auto [&::-webkit-scrollbar]:hidden settings-menu-return">
      <div className="px-5 pt-8 pb-6 border-b border-white/[0.05]">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <img src={currentUser.avatar} alt="avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-white/[0.08]" />
            <div className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-[#0f0f13] ${statusOption.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white tracking-tight truncate">{currentUser.name}</h1>
            <p className="text-sm text-zinc-400 truncate">{currentUser.handle}</p>
            <p className="text-xs text-zinc-600 mt-0.5 truncate">{currentUser.about || 'No bio set'}</p>
          </div>

          {/* Logout button — right side of header, opposite the avatar */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            title="Log out"
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5 pb-36">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Account</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] overflow-hidden divide-y divide-white/[0.04]">
            <SettingsRow icon={<UserCheck size={17} />} title="Profile and Identity" subtitle="Name, photo, handle, status" onClick={() => { setProfileDraft({ ...currentUser }); navigateTo('profile'); }} />
            <SettingsRow icon={<Shield size={17} />} title="Privacy and Security" subtitle={`${blockedUsers.length > 0 ? `${blockedUsers.length} blocked · ` : ''}Read receipts, last seen`} onClick={() => navigateTo('privacy')} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Preferences</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] overflow-hidden divide-y divide-white/[0.04]">
            <SettingsRow icon={<Bell size={17} />} title="Notifications" subtitle={userSettings.notifications.dnd?.enabled ? `🌙 DND ${userSettings.notifications.dnd.from}-${userSettings.notifications.dnd.to}` : `Sound: ${userSettings.notifications.sound !== false ? 'On' : 'Off'} · Previews: ${userSettings.notifications.preview !== false ? 'On' : 'Off'}`} onClick={() => navigateTo('notifications')} />
            <SettingsRow icon={<Palette size={17} />} title="Appearance"
              subtitle={`${(userSettings.appearance.theme || 'dark')[0].toUpperCase() + (userSettings.appearance.theme || 'dark').slice(1)} theme · ${userSettings.appearance.fontSize || 'Medium'} text`}
              onClick={() => navigateTo('appearance')} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Safety and AI</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] overflow-hidden divide-y divide-white/[0.04]">
            <SettingsRow icon={<ShieldCheck size={17} />} title="Content Filters" subtitle={`Profanity mode: ${userSettings.safety.profanityFilter}`} onClick={() => navigateTo('safety')} />
            <SettingsRow icon={<Sparkles size={17} />} title="AI and Smart Replies" subtitle={`Smart replies ${userSettings.ai.smartReplies ? 'on' : 'off'}`} onClick={() => navigateTo('ai')} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Storage and Data</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] overflow-hidden divide-y divide-white/[0.04]">
            <SettingsRow
              icon={<Database size={17} />}
              title="Storage"
              subtitle={`${chatDetails.reduce((a, c) => a + c.messages.length, 0)} messages stored`}
              onClick={() => navigateTo('storage')}
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">About</p>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.05] overflow-hidden divide-y divide-white/[0.04]">
            <SettingsRow icon={<HelpCircle size={17} />} title="Help and Support" subtitle="FAQ, send feedback, about" onClick={() => navigateTo('help')} />
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-700 pt-2">App v1.0.0</p>
      </div>
    </div>{/* scroll div */}

    {/* Logout Confirmation Modal — absolute relative to wrapper, not inside scroll */}
    {showLogoutConfirm && (
      <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-[85vw] max-w-sm bg-[#1a1a1c] border border-white/[0.08] rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center">
              <LogOut size={24} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Log out?</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">You will be returned to the login screen. Any unsaved drafts will be lost.</p>
            </div>
            <div className="flex gap-3 w-full mt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-zinc-300 hover:bg-white/[0.08] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-400 text-sm font-bold text-white transition-colors shadow-lg shadow-red-500/20"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}


// -----------------------------------------------------------
// 📋 TASK PANEL COMPONENT
// -----------------------------------------------------------
