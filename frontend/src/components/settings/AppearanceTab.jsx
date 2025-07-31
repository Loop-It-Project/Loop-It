import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

const AppearanceTab = ({ theme, onToggleTheme }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-primary dark:text-white">Appearance</h2>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 text-sm bg-card dark:bg-gray-700 text-secondary dark:text-muted rounded-lg hover:bg-gray-200 hover:cursor-pointer dark:hover:bg-gray-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="space-y-6">
        {/* Theme Toggle */}
        <div>
          <h3 className="text-lg font-medium text-primary dark:text-white mb-4">Theme</h3>
          <div className="flex items-center justify-between p-4 border border-primary dark:border-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-primary dark:text-white">Dark Mode</p>
              <p className="text-sm text-secondary dark:text-muted">Toggle between light and dark themes</p>
            </div>
            <ThemeToggle showLabel={false} />
          </div>
        </div>

        {/* Theme Preview */}
        <div>
          <h3 className="text-lg font-medium text-primary dark:text-white mb-4">Current Theme</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Light Theme Preview */}
            <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              theme === 'light' ? 'border-blue-500' : 'border-primary dark:border-gray-700'
            }`}>
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                  <div className="h-3 bg-gray-800 rounded w-16"></div>
                </div>
                <div className="space-y-1">
                  <div className="h-2 bg-gray-300 rounded w-full"></div>
                  <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
              <p className="text-center mt-2 text-sm font-medium text-primary dark:text-white">
                Light Theme
              </p>
            </div>

            {/* Dark Theme Preview */}
            <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              theme === 'dark' ? 'border-blue-500' : 'border-primary dark:border-gray-700'
            }`}>
              <div className="bg-gray-800 p-3 rounded shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="space-y-1">
                  <div className="h-2 bg-gray-600 rounded w-full"></div>
                  <div className="h-2 bg-gray-600 rounded w-3/4"></div>
                </div>
              </div>
              <p className="text-center mt-2 text-sm font-medium text-primary dark:text-white">
                Dark Theme
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceTab;