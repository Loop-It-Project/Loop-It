import { useNavigate } from 'react-router-dom';

const SecurityTab = ({ 
  passwordData, 
  setPasswordData, 
  saving, 
  onSubmit 
}) => {
  const navigate = useNavigate();

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-primary dark:text-white">Security</h2>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 text-sm bg-card dark:bg-gray-700 text-secondary dark:text-muted rounded-lg hover:bg-gray-200 hover:cursor-pointer dark:hover:bg-gray-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-primary dark:text-white">Change Password</h3>
        
        <div>
          <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
            Current Password
          </label>
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
            className="w-full px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your current password"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
            New Password
          </label>
          <input
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
            className="w-full px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your new password"
            minLength={6}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            className="w-full px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Confirm your new password"
            minLength={6}
            required
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-card text-white rounded-lg hover:bg-gray-600 hover:cursor-pointer transition-colors"
        >
          Back to Dashboard
        </button>
        
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:cursor-pointer transition-colors disabled:opacity-50"
        >
          {saving ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </form>
  );
};

export default SecurityTab;