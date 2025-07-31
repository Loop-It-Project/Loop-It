import { useState } from 'react';
import { 
  Bug, 
  AlertCircle, 
  Send, 
  X, 
  CheckCircle,
  Monitor,
  Globe,
  Smartphone
} from 'lucide-react';
import BugReportService from '../services/bugReportService';

const BugReportForm = ({ isVisible, onClose, user }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'ui', label: 'UI/Design Problem', icon: '🎨' },
    { value: 'functionality', label: 'Funktionsfehler', icon: '⚙️' },
    { value: 'performance', label: 'Performance Problem', icon: '⚡' },
    { value: 'security', label: 'Sicherheitsproblem', icon: '🔒' },
    { value: 'data', label: 'Datenfehler', icon: '📊' },
    { value: 'other', label: 'Sonstiges', icon: '🐛' }
  ];

  const priorities = [
    { value: 'low', label: 'Niedrig', color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'medium', label: 'Mittel', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { value: 'high', label: 'Hoch', color: 'text-orange-600', bg: 'bg-orange-100' },
    { value: 'critical', label: 'Kritisch', color: 'text-red-600', bg: 'bg-red-100' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await BugReportService.createBugReport(formData);

      if (result.success) {
        setSubmitted(true);
        
        // Reset form after delay
        setTimeout(() => {
          setSubmitted(false);
          setFormData({
            title: '',
            description: '',
            category: 'other',
            priority: 'medium'
          });
          onClose();
        }, 3000);
      } else {
        setError(result.error || 'Fehler beim Senden des Bug Reports');
      }
    } catch (error) {
      console.error('Submit bug report error:', error);
      setError('Netzwerkfehler beim Senden des Bug Reports');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Bug className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Bug Report</h2>
              <p className="text-sm text-tertiary">Hilf uns, das Problem zu beheben</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {submitted ? (
          /* Success State */
          <div className="p-8 text-center">
            <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">
              Danke für deinen Bug Report!
            </h3>
            <p className="text-tertiary mb-4">
              Wir haben dein Report erhalten und werden es so schnell wie möglich bearbeiten.
            </p>
            <p className="text-sm text-gray-500">
              Du kannst den Status deiner Reports in den Einstellungen verfolgen.
            </p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-secondary mb-2">
                Titel des Problems *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={200}
                placeholder="Kurze Beschreibung des Problems..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/200 Zeichen
              </p>
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-secondary mb-2">
                  Kategorie
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 cursor-pointer rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-secondary mb-2">
                  Priorität
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 cursor-pointer rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-secondary mb-2">
                Beschreibung des Problems *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                maxLength={5000}
                placeholder="Beschreibe das Problem so detailliert wie möglich:&#10;&#10;• Was hast du getan?&#10;• Was ist passiert?&#10;• Was hättest du erwartet?&#10;• In welchem Browser/Gerät tritt das Problem auf?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/5000 Zeichen
              </p>
            </div>

            {/* Browser Info Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Monitor className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Automatische Systemerfassung</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Browser-Informationen, Bildschirmauflösung und aktuelle URL werden automatisch erfasst, um bei der Problemlösung zu helfen.
                  </p>
                </div>
              </div>
            </div>

            {/* Current User Info */}
            {user && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.displayName || user.username}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg cursor-pointer text-secondary hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.description.trim()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg cursor-pointer hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Senden...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Bug Report senden</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BugReportForm;