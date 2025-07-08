import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../components/Backbutton';

const Hobbies = ({ onNavigate }) => {
  const navigate = useNavigate();
    const [formData, setFormData] = useState({
      email: '',
      password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    };
  
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

        {/* Hobbies Form */}
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

            {/*Dropdowns for Hobbies*/}

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