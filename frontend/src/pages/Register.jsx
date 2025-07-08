import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

const Register = ({ onLogin }) => {
  const navigate = useNavigate();

  // State to manage form data and errors
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const validateForm = () => {
    const newErrors = {};

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Passwort muss mindestens 6 Zeichen lang sein';
    }

    if (!formData.email.includes('@')) {
      newErrors.email = 'Bitte gib eine gültige E-Mail Adresse ein';
    }

    if (formData.username.length < 3) {
      newErrors.username = 'Benutzername muss mindestens 3 Zeichen lang sein';
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const { confirmPassword, ...submitData } = formData;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submitData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      // Bei HTTP Fehler versuchen Text zu lesen statt JSON
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || 'Registrierung fehlgeschlagen';
        
        if (errorData.errors) {
          // Handle validation errors
          const errorObj = {};
          errorData.errors.forEach(error => {
            errorObj[error.path] = error.msg;
          });
          setErrors(errorObj);
          return;
        }
      } catch (jsonError) {
        // Falls JSON parsing fehlschlägt, Text lesen
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        errorMessage = `Server Error (${response.status}): ${errorText || 'Unbekannter Fehler'}`;
      }
      
      setErrors({ general: errorMessage });
      return;
    }

      // Erfolgreiche Response - JSON parsen
      let data;
      
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parse error on success response:', jsonError);
        setErrors({ general: 'Server-Antwort konnte nicht verarbeitet werden' });
        return;
      }

      // Erfolgreiche Registrierung
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      
        onLogin(data.user);
        navigate('/dashboard');
      } else {
        setErrors({ general: 'Registrierung erfolgreich, aber Login-Daten unvollständig' });
      }

    } catch (error) {
      console.error('Registration error:', error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setErrors({ general: 'Verbindung zum Server fehlgeschlagen. Ist der Server gestartet?' });
      } else {
        setErrors({ general: 'Verbindungsfehler. Bitte versuche es später erneut.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center px-6 py-8">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <Link 
          to="/"
          className="flex items-center text-white mb-8 hover:text-gray-200 hover:cursor-pointer transition"
        >
          <ArrowLeft size={20} className="mr-2" />
          Zurück
        </Link>

        {/* Register Card */}
        <div className="bg-card rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Jetzt registrieren!</h1>
            <p className="text-secondary">Erstelle deinen Loop-It Account und starte durch</p>
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Vorname
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.firstName ? 'border-red-500' : 'border-secondary'
                    }`}
                    placeholder="Max"
                    required
                  />
                </div>
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Nachname
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.lastName ? 'border-red-500' : 'border-secondary'
                  }`}
                  placeholder="Mustermann"
                  required
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Benutzername
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.username ? 'border-red-500' : 'border-secondary'
                  }`}
                  placeholder="max_mustermann"
                  required
                />
              </div>
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                E-Mail Adresse
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.email ? 'border-red-500' : 'border-secondary'
                  }`}
                  placeholder="max@example.com"
                  required
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Passwort
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.password ? 'border-red-500' : 'border-secondary'
                  }`}
                  placeholder="Mindestens 6 Zeichen"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-secondary hover:cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Passwort bestätigen
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-secondary'
                  }`}
                  placeholder="Passwort wiederholen"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-secondary hover:cursor-pointer transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 hover:cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? 'Wird registriert...' : 'Account erstellen'}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-secondary">
              Bereits ein Account?{' '}
              <Link
                to="/login"
                className="text-purple-600 font-semibold hover:text-purple-700 hover:cursor-pointer transition"
              >
                Jetzt anmelden
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;