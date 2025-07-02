import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Mail, Lock } from 'lucide-react';

const Login = ({ onNavigate, onLogin }) => {
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
      const response = await fetch(`/api/auth/login`, {
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
        <button 
          onClick={() => onNavigate('landing')}
          className="flex items-center text-white mb-8 hover:text-gray-200 transition"
        >
          <ArrowLeft size={20} className="mr-2" />
          Zurück
        </button>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Willkommen zurück!</h1>
            <p className="text-gray-600">Melde dich in deinem Loop-It Account an</p>
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail Adresse
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="deine@email.com"
                  required
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passwort
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Dein Passwort"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Noch kein Account?{' '}
              <button
                onClick={() => onNavigate('register')}
                className="text-purple-600 font-semibold hover:text-purple-700 transition"
              >
                Jetzt registrieren
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;