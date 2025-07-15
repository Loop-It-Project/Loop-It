import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from './Backbutton';
import UniverseService from '../services/universeService';

const FirstUniverses = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableUniverses, setAvailableUniverses] = useState([]);
  const [selectedUniverses, setSelectedUniverses] = useState([]);

  // Available categories (matching CreateUniverse component)
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

  // Load universes when categories change
  useEffect(() => {
    const loadUniversesByCategories = async () => {
      if (selectedCategories.length === 0) {
        setAvailableUniverses([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load universes for each selected category
        const promises = selectedCategories.map(category =>
          UniverseService.discoverUniverses(category)
        );

        const responses = await Promise.all(promises);
        
        // Combine and deduplicate universes
        const allUniverses = responses.flatMap(response => 
          response.success ? response.data.universes : []
        );
        
        // Remove duplicates based on universe ID
        const uniqueUniverses = Array.from(
          new Map(allUniverses.map(item => [item.id, item])).values()
        );

        setAvailableUniverses(uniqueUniverses);
      } catch (err) {
        console.error('Error loading universes:', err);
        setError('Failed to load universes');
      } finally {
        setLoading(false);
      }
    };

    loadUniversesByCategories();
  }, [selectedCategories]);

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      }
      return [...prev, category];
    });
  };

  const handleUniverseSelect = (universeId) => {
    setSelectedUniverses(prev => {
      if (prev.includes(universeId)) {
        return prev.filter(id => id !== universeId);
      }
      return [...prev, universeId];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedUniverses.length === 0) {
      setError('Bitte wähle mindestens ein Universe aus');
      return;
    }

    setLoading(true);

    try {
      // Join all selected universes
      await Promise.all(
        selectedUniverses.map(universeId => {
          const universe = availableUniverses.find(u => u.id === universeId);
          return UniverseService.joinUniverse(universe.slug);
        })
      );

      // Navigate to dashboard after successful joins
      navigate('/dashboard');
    } catch (err) {
      console.error('Error joining universes:', err);
      setError('Failed to join selected universes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="max-w-md w-full">
        <BackButton />

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Teile deine Hobbys mit uns!</h1>
            <p className="text-gray-600">Wähle Kategorien und tritt passenden Universen bei</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Categories Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Wähle deine Interessensgebiete
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(category => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => handleCategoryChange(category.value)}
                    className={`p-2 rounded-lg text-sm font-medium transition ${
                      selectedCategories.includes(category.value)
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    } border`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Universes Selection */}
            {selectedCategories.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Verfügbare Universes
                </label>
                {loading ? (
                  <p className="text-gray-500">Lade Universes...</p>
                ) : availableUniverses.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableUniverses.map(universe => (
                      <label
                        key={universe.id}
                        className="flex items-center p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUniverses.includes(universe.id)}
                          onChange={() => handleUniverseSelect(universe.id)}
                          className="h-4 w-4 text-purple-600 rounded border-gray-300"
                        />
                        <div className="ml-3">
                          <div className="font-medium text-gray-700">{universe.name}</div>
                          <div className="text-sm text-gray-500">
                            {universe.memberCount || 0} Mitglieder
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Keine Universes in diesen Kategorien gefunden</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || selectedUniverses.length === 0}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Wird verarbeitet...' : 'Auswahl bestätigen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FirstUniverses;