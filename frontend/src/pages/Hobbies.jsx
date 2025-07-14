import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import BackButton from '../components/Backbutton';
import UniverseService from '../services/universeService';
import FeedService from '../services/feedServices';


const Hobbies = ({ user, onLogin }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Query Parameter aus Router
  const fromHashtag = searchParams.get('hashtag'); // Optional: Hashtag aus URL
  const [universe, setUniverse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const { universeSlug } = useParams();
    const [formData, setFormData] = useState({
      id: user?.id || '',
      universeId: universeSlug || '',

    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

      // Load Universe details on mount
  // and whenever universeSlug or user changes
  // Added user?.id to dependencies to ensure it reloads when user changes
  useEffect(() => {
    const loadUniverse = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Loading universe:', universeSlug);

        const response = await FeedService.getUniverseDetails(universeSlug);
        
        console.log('🔍 API Response:', response);

        if (response.success) {
          console.log('✅ Universe Details loaded:', response.data);
          setUniverse(response.data);
          
          // Set membership status from API response
          setIsJoined(response.data.isMember || response.data.membershipStatus === 'member');
        } else {
          console.error('❌ API Error:', response.error);
          throw new Error(response.error || 'Universe not found');
        }
      } catch (err) {
        console.error('❌ Error loading universe:', err);
        setError(err.message || 'Failed to load universe');
      } finally {
        setLoading(false);
      }
    };

    if (universeSlug) {
      loadUniverse();
    }
  }, [universeSlug, user?.id]);
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setErrors({});
  
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          // Save token to localStorage
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          onLogin(data.user);
          navigate('/dashboard');
        } else {
          if (data.errors) {
            // Handle validation errors
            const errorObj = {};
            data.errors.forEach(error => {
              errorObj[error.path] = error.msg;
            });
            setErrors(errorObj);
          } else {
            setErrors({ general: data.error || 'Login fehlgeschlagen' });
          }
        }
      } catch (error) {
        console.error('Login error:', error);
        setErrors({ general: 'Verbindungsfehler. Bitte versuche es später erneut.' });
      } finally {
        setIsLoading(false);
      }
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center px-6">
      <div className="max-w-md w-full">

        {/* Back Button */}
        < BackButton />

        {/* Universes Form */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Teile deine Hoobbys mit uns!</h1>
            <p className="text-gray-600">Wähle aus bestehenden Universen deine Hobbys aus</p>
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/*Dropdowns for Universes*/}
            <div className="space-y-4">
              {loading ? (
                <p className="text-gray-500">Lade Universen...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : (
                universe && (
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Universum: {universe.name}</h2>
                    <p className="text-gray-600 mb-4">{universe.description}</p>
                    <p className="text-gray-500">Mitglieder: {universe.membersCount}</p>
                  </div>
                )
              )}
            </div>


            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Wird angemeldet...' : 'Auswahl bestätigen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Hobbies;