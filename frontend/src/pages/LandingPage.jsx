import { Link } from 'react-router-dom';
import { Users, Heart, MapPin, MessageCircle } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <nav className="flex justify-between items-center">
          <div className="space-x-4">
            
            {/* Login Link */}
            <Link 
              to="/login"
              className="text-white hover:text-gray-200 hover:cursor-pointer transition hover:scale-105"
            >
              Anmelden
            </Link>

            {/* Register Link */}
            <Link 
              to="/register"
              className="bg-card text-purple-600 px-6 py-2 rounded-full font-semibold hover:bg-hover hover:cursor-pointer transition hover:scale-105"
            >
              Registrieren
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-6xl font-bold text-white mb-6">
          Verbinde dich über deine
          <span className="text-yellow-300"> Hobbys</span>
        </h1>
        <p className="text-xl text-gray-200 mb-12 max-w-3xl mx-auto">
          Loop-It bringt Menschen mit gemeinsamen Hobbys zusammen. 
          Entdecke neue Freunde, teile deine Leidenschaft und werde Teil einer Community, 
          die deine Interessen teilt.
        </p>
        
        <Link 
          to="/register"
          className="bg-yellow-400 text-purple-800 px-8 py-4 rounded-full text-xl font-bold hover:bg-yellow-300 transition transform hover:scale-105"
        >
          Jetzt kostenlos starten
        </Link>
      </main>

      {/* Features */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          Warum Loop-It?
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center text-white">
            <Heart className="mx-auto mb-4 text-pink-400" size={48} />
            <h3 className="text-xl font-semibold mb-2">Hobby-basierte Verbindungen</h3>
            <p className="text-gray-300">Finde Menschen, die deine Leidenschaften teilen</p>
          </div>
          
          <div className="text-center text-white">
            <MapPin className="mx-auto mb-4 text-green-400" size={48} />
            <h3 className="text-xl font-semibold mb-2">Lokale Community</h3>
            <p className="text-gray-300">Entdecke Hobby-Partner in deiner Nähe</p>
          </div>
          
          <div className="text-center text-white">
            <MessageCircle className="mx-auto mb-4 text-blue-400" size={48} />
            <h3 className="text-xl font-semibold mb-2">Chat & Connect</h3>
            <p className="text-gray-300">Chatte in Hobby-Gruppen oder privat</p>
          </div>
          
          <div className="text-center text-white">
            <Users className="mx-auto mb-4 text-purple-400" size={48} />
            <h3 className="text-xl font-semibold mb-2">Aktive Community</h3>
            <p className="text-gray-300">Werde Teil lebendiger Hobby-Communitys</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;