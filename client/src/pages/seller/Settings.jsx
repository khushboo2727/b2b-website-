import React, { useEffect, useMemo, useState } from 'react';
import SellerLayout from '../../components/layout/SellerLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Bell, Shield, Lock, Save, LogOut, Mail, Phone } from 'lucide-react';

const Settings = () => {
  const { user, logout } = useAuth();

  const storageKey = useMemo(() => {
    const id = user?._id || user?.id || 'guest';
    return `sellerSettings:${id}`;
  }, [user]);

  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    pushNotifications: false,
    leadAlerts: true,
    productUpdates: true,
    newsletter: false,
    twoFA: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPrefs((p) => ({ ...p, ...parsed }));
      }
    } catch (e) {
      // ignore JSON parse errors
    }
  }, [storageKey]);

  const handlePrefChange = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  const savePreferences = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(storageKey, JSON.stringify(prefs));
      const toast = { success: showSuccess, error: showError, warning: showWarning, info: showInfo };
      toast.success('Preferences saved successfully');
    } catch (e) {
      toast.error('Failed to save preferences');
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    // Placeholder: No API on server yet for changing password.
    toast.error('Change Password API is not available yet. Please contact admin.');
  };

  return (
    <SellerLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            <p className="text-sm text-gray-500">Manage your account, notifications and security</p>
          </div>
          <button
            onClick={savePreferences}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <Save size={18} />
            Save
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Account info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Account</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500">Name</label>
                  <div className="mt-1 px-3 py-2 rounded border bg-gray-50 text-gray-700">
                    {user?.name || '-'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-500" />
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500">Email</label>
                    <div className="mt-1 px-3 py-2 rounded border bg-gray-50 text-gray-700">
                      {user?.email || '-'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-500" />
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500">Phone</label>
                    <div className="mt-1 px-3 py-2 rounded border bg-gray-50 text-gray-700">
                      {user?.phone || '-'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500">Role</label>
                    <div className="mt-1 px-3 py-2 rounded border bg-gray-50 text-gray-700 capitalize">
                      {user?.role || '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Status</label>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          user?.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : user?.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user?.status || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="mt-4 inline-flex items-center gap-2 px-3 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Security</h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-md transition-colors"
                >
                  <Lock size={18} />
                  Change Password
                </button>

                <p className="text-xs text-gray-500">
                  Note: Change Password API अभी उपलब्ध नहीं है, इसलिए यह placeholder है।
                </p>
              </form>
            </div>
          </div>

          {/* Right column: Preferences */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={savePreferences} className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="text-blue-600" size={20} />
                <h2 className="text-lg font-semibold text-gray-800">Notification Preferences</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Email Notifications</p>
                    <p className="text-sm text-gray-500">Get updates via email for leads and product status</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={prefs.emailNotifications}
                      onChange={handlePrefChange('emailNotifications')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 relative">
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all ${prefs.emailNotifications ? 'translate-x-5' : ''}`}></div>
                    </div>
                  </label>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Push Notifications</p>
                    <p className="text-sm text-gray-500">Enable browser push notifications</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={prefs.pushNotifications}
                      onChange={handlePrefChange('pushNotifications')}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 relative">
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all ${prefs.pushNotifications ? 'translate-x-5' : ''}`}></div>
                    </div>
                  </label>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Lead Alerts</p>
                    <p className="text-sm text-gray-500">Notify me instantly for new inquiries</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={prefs.leadAlerts}
                      onChange={handlePrefChange('leadAlerts')}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 relative">
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all ${prefs.leadAlerts ? 'translate-x-5' : ''}`}></div>
                    </div>
                  </label>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Product Updates</p>
                    <p className="text-sm text-gray-500">Stock, price changes and moderation updates</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={prefs.productUpdates}
                      onChange={handlePrefChange('productUpdates')}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 relative">
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all ${prefs.productUpdates ? 'translate-x-5' : ''}`}></div>
                    </div>
                  </label>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Newsletter</p>
                    <p className="text-sm text-gray-500">Occasional tips, best practices and platform updates</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={prefs.newsletter}
                      onChange={handlePrefChange('newsletter')}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 relative">
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all ${prefs.newsletter ? 'translate-x-5' : ''}`}></div>
                    </div>
                  </label>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Two-factor Authentication</p>
                    <p className="text-sm text-gray-500">Add extra security to your account</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={prefs.twoFA}
                      onChange={handlePrefChange('twoFA')}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 relative">
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all ${prefs.twoFA ? 'translate-x-5' : ''}`}></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    {/* </div> */}
    </SellerLayout>
  );
};

export default Settings;
