import { useState, useEffect, useCallback } from 'react';
import { X, Globe, Lock, Users, CheckCircle, Settings } from 'lucide-react';
import FeedService from '../services/feedServices';
import useEscapeKey from '../hooks/useEscapeKey';

const CreateUniverse = ({ onClose, onUniverseCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    isPublic: true,
    requireApproval: false,
    allowImages: true,
    allowPolls: true,
    minAgeRequirement: 13,
    rules: []
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [ruleText, setRuleText] = useState('');
  const [nameCheckLoading, setNameCheckLoading] = useState(false);
  const [nameAvailable, setNameAvailable] = useState(null);

  const categories = [
    { value: 'technology', label: 'Technologie' },
    { value: 'sports', label: 'Sport' },
    { value: 'music', label: 'Musik' },
    { value: 'art', label: 'Kunst' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'cooking', label: 'Kochen' },
    { value: 'travel', label: 'Reisen' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'photography', label: 'Fotografie' },
    { value: 'books', label: 'Bücher' },
    { value: 'movies', label: 'Filme' },
    { value: 'science', label: 'Wissenschaft' },
    { value: 'other', label: 'Andere' }
  ];

  // Escape key handler to close the modal
  useEscapeKey(() => onClose(), true);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Add and remove rules
  const addRule = () => {
    if (ruleText.trim()) {
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, { id: Date.now(), text: ruleText.trim() }]
      }));
      setRuleText('');
    }
  };

  const removeRule = (ruleId) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule.id !== ruleId)
    }));
  };

  // Name-Eindeutigkeit prüfen
  const checkNameAvailability = useCallback(async (name) => {
    if (!name || name.length < 3) {
      setNameAvailable(null);
      return;
    }

    setNameCheckLoading(true);
    try {
      const response = await FeedService.checkUniverseName(name);
      if (response.success) {
        setNameAvailable(response.data.available);
      }
    } catch (error) {
      console.error('Error checking name:', error);
    } finally {
      setNameCheckLoading(false);
    }
  }, []);

  // Debounced Name Check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name) {
        checkNameAvailability(formData.name);
      }
    }, 500);
  
    return () => clearTimeout(timer);
  }, [formData.name, checkNameAvailability]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Universe-Name ist erforderlich';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name muss mindestens 3 Zeichen lang sein';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name darf maximal 50 Zeichen lang sein';
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(formData.name)) {
      newErrors.name = 'Name darf nur Buchstaben, Zahlen, Leerzeichen, Bindestriche und Unterstriche enthalten';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Beschreibung darf maximal 500 Zeichen lang sein';
    }

    if (formData.minAgeRequirement < 13 || formData.minAgeRequirement > 100) {
      newErrors.minAgeRequirement = 'Mindestalter muss zwischen 13 und 100 Jahren liegen';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        rules: formData.rules.map(rule => rule.text)
      };
      
      const response = await FeedService.createUniverse(submitData);
      
      if (response.success) {
        onUniverseCreated(response.data);
        onClose();
      } else {
        setErrors({ submit: response.error || 'Fehler beim Erstellen des Universe' });
      }
    } catch (error) {
      console.error('Create universe error:', error);
      setErrors({ submit: 'Fehler beim Erstellen des Universe' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-primary flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary">Neues Universe erstellen</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-secondary hover:cursor-pointer transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Grundinformationen</h3>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary mb-1">
                Universe-Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : nameAvailable === false ? 'border-red-500' : nameAvailable === true ? 'border-green-500' : 'border-secondary'
                  }`}
                  placeholder="z.B. React Entwickler Deutschland"
                />

                {/* Loading/Status Indicator */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {nameCheckLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : nameAvailable === true ? (
                    <div className="text-green-600">✓</div>
                  ) : nameAvailable === false ? (
                    <div className="text-red-600">✗</div>
                  ) : null}
                </div>
              </div>
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              {nameAvailable === false && !errors.name && (
                <p className="text-red-500 text-sm mt-1">Dieser Name ist bereits vergeben</p>
              )}
              {nameAvailable === true && (
                <p className="text-green-500 text-sm mt-1">Name ist verfügbar</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-secondary mb-1">
                Beschreibung
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-secondary'
                }`}
                placeholder="Beschreibe dein Universe..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-secondary mb-1">
                Kategorie
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Kategorie wählen</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Privatsphäre & Zugang</h3>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="isPublic"
                  value="true"
                  checked={formData.isPublic === true}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: true }))}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <Globe size={20} className="text-green-600" />
                  <div>
                    <div className="text-sm font-medium">Öffentlich</div>
                    <div className="text-xs text-tertiary">Jeder kann das Universe finden und beitreten</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="isPublic"
                  value="false"
                  checked={formData.isPublic === false}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: false }))}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <Lock size={20} className="text-red-600" />
                  <div>
                    <div className="text-sm font-medium">Privat</div>
                    <div className="text-xs text-tertiary">Nur per Einladung zugänglich</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="requireApproval"
                  checked={formData.requireApproval}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <CheckCircle size={20} className="text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">Beitrittsanfragen genehmigen</div>
                    <div className="text-xs text-tertiary">Neue Mitglieder müssen genehmigt werden</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Content Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Inhalts-Einstellungen</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="allowImages"
                  checked={formData.allowImages}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Bilder erlauben</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="allowPolls"
                  checked={formData.allowPolls}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Umfragen erlauben</span>
              </label>
            </div>

            <div>
              <label htmlFor="minAgeRequirement" className="block text-sm font-medium text-secondary mb-1">
                Mindestalter
              </label>
              <input
                type="number"
                id="minAgeRequirement"
                name="minAgeRequirement"
                value={formData.minAgeRequirement}
                onChange={handleInputChange}
                min="13"
                max="100"
                className={`w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.minAgeRequirement ? 'border-red-500' : 'border-secondary'
                }`}
              />
              {errors.minAgeRequirement && <p className="text-red-500 text-sm mt-1">{errors.minAgeRequirement}</p>}
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Regeln</h3>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={ruleText}
                onChange={(e) => setRuleText(e.target.value)}
                placeholder="Neue Regel hinzufügen..."
                className="flex-1 px-3 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
              />
              <button
                type="button"
                onClick={addRule}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:cursor-pointer transition-colors"
              >
                Hinzufügen
              </button>
            </div>

            {formData.rules.length > 0 && (
              <div className="space-y-2">
                {formData.rules.map((rule, index) => (
                  <div key={rule.id} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                    <span className="text-sm">
                      {index + 1}. {rule.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRule(rule.id)}
                      className="text-red-600 hover:text-red-800 hover:cursor-pointer transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-primary">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-secondary bg-hover rounded-lg hover:bg-tertiary hover:cursor-pointer transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Erstelle...' : 'Universe erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUniverse;
