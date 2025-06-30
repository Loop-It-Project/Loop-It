import React from 'react';
import { LogOut, User, Settings, Plus } from 'lucide-react';

const Dashboard = ({ user, onLogout }) => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-purple-600">Loop-It</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User size={20} className="text-gray-400" />
                <span className="text-gray-700">Hallo, {user.displayName || user.username}!</span>
              </div>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 transition">
                <Settings size={20} />
              </button>
              
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                <LogOut size={16} />
                <span>Abmelden</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="text-center py-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Willkommen bei Loop-It! 🎉
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Du bist erfolgreich angemeldet. Hier wird bald dein personalisierter Hobby-Feed erscheinen.
          </p>
          
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Nächste Schritte:</h3>
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <span className="text-gray-700">Vervollständige dein Profil</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <span className="text-gray-700">Wähle deine Hobbys aus</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <span className="text-gray-700">Entdecke andere Hobby-Enthusiasten</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <span className="text-gray-700">Erstelle deinen ersten Post</span>
              </div>
            </div>
            
            <button className="mt-8 bg-yellow-400 text-purple-800 px-6 py-3 rounded-full font-semibold hover:bg-yellow-300 transition flex items-center space-x-2 mx-auto">
              <Plus size={20} />
              <span>Profil vervollständigen</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;