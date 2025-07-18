import { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  X, 
  Star, 
  MapPin, 
  Calendar, 
  User, 
  Settings,
  TrendingUp,
  Filter,
  RefreshCw,
  Sparkles,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import SwipeService from '../services/swipeService';

const SwipeGame = ({ currentUser, onClose }) => {
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  const cardRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });

  // Komponente initialisieren
  useEffect(() => {
    loadPotentialMatches();
    loadPreferences();
    loadStats();
  }, []);

  // Potentielle Matches laden
  const loadPotentialMatches = async () => {
    try {
      setIsLoading(true);
      const result = await SwipeService.getPotentialMatches(20);
      
      if (result.success) {
        setPotentialMatches(result.data.matches);
        setCurrentCardIndex(0);
      } else {
        console.error('Failed to load potential matches:', result.error);
      }
    } catch (error) {
      console.error('Error loading potential matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Präferenzen laden
  const loadPreferences = async () => {
    try {
      const result = await SwipeService.getSwipePreferences();
      if (result.success) {
        setPreferences(result.data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  // Statistiken laden
  const loadStats = async () => {
    try {
      const result = await SwipeService.getSwipeStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Swipe verarbeiten
  const handleSwipe = async (direction) => {
    if (currentCardIndex >= potentialMatches.length) return;

    const currentMatch = potentialMatches[currentCardIndex];
    const action = direction === 'right' ? 'like' : 'skip';

    try {
      setSwipeDirection(direction);
      
      // Animation starten
      setTimeout(async () => {
        const result = await SwipeService.processSwipe(currentMatch.id, action);
        
        if (result.success) {
          // Nächste Karte anzeigen
          setCurrentCardIndex(prev => prev + 1);
          setSwipeDirection(null);
          setDragOffset({ x: 0, y: 0 });
          
          // Bei Match Modal anzeigen
          if (result.data.isMatch) {
            setMatchData({
              user: currentMatch,
              match: result.data.match
            });
            setShowMatch(true);
          }
          
          // Stats aktualisieren
          loadStats();
          
          // Neue Matches laden wenn wenige übrig
          if (currentCardIndex >= potentialMatches.length - 3) {
            loadPotentialMatches();
          }
        } else {
          console.error('Failed to process swipe:', result.error);
        }
      }, 300);

    } catch (error) {
      console.error('Error processing swipe:', error);
    }
  };

  // Touch/Mouse Events
  const handleDragStart = (e) => {
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX, y: clientY };
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Swipe-Threshold prüfen
    const threshold = 100;
    
    if (Math.abs(dragOffset.x) > threshold) {
      const direction = dragOffset.x > 0 ? 'right' : 'left';
      handleSwipe(direction);
    } else {
      // Karte zurücksetzen
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Aktuelle Karte rendern
  const renderCurrentCard = () => {
    if (isLoading) {
      return (
        <div className="bg-card rounded-xl shadow-xl p-8 text-center h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-tertiary">Lade Profile...</p>
          </div>
        </div>
      );
    }

    if (currentCardIndex >= potentialMatches.length) {
      return (
        <div className="bg-card rounded-xl shadow-2xl p-8 text-center border-1 border-primary h-96 flex flex-col items-center justify-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-gray-secondary mb-4">
            Keine weiteren Profile!
          </h3>
          <p className="text-tertiary mb-6">
            Du hast alle verfügbaren Profile durchgesehen. Schau später wieder vorbei!
          </p>
          <button
            onClick={loadPotentialMatches}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer shadow-xl hover:bg-purple-700 transition-colors flex items-center mx-auto"
          >
            <RefreshCw size={20} className="mr-2" />
            Neue Profile laden
          </button>
        </div>
      );
    }

    const currentMatch = potentialMatches[currentCardIndex];
    const dragRotation = dragOffset.x * 0.1;
    const dragScale = isDragging ? 1.05 : 1;

    return (
      <div
        ref={cardRef}
        className="bg-card rounded-xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-300"
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragRotation}deg) scale(${dragScale})`,
          zIndex: swipeDirection ? 10 : 1
        }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        {/* Swipe-Overlays */}
        <div 
          className={`absolute inset-0 bg-green-500 bg-opacity-75 flex items-center justify-center z-10 transition-opacity duration-300 ${
            dragOffset.x > 50 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="text-white text-4xl font-bold flex items-center">
            <Heart size={48} className="mr-4" />
            LIKE
          </div>
        </div>

        <div 
          className={`absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center z-10 transition-opacity duration-300 ${
            dragOffset.x < -50 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="text-white text-4xl font-bold flex items-center">
            <X size={48} className="mr-4" />
            SKIP
          </div>
        </div>

        {/* Profilbild */}
        <div className="relative h-96 bg-gradient-to-br from-purple-400 to-pink-400">
          {currentMatch.avatarId ? (
            <img
              src={`/api/media/avatar/${currentMatch.avatarId}`}
              alt={currentMatch.displayName || currentMatch.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={80} className="text-white opacity-50" />
            </div>
          )}
          
          {/* Kompatibilitätsscore */}
          <div className="absolute top-4 right-4 bg-card/90 px-3 py-1 rounded-full">
            <div className="flex items-center text-sm font-semibold">
              <Sparkles size={16} className="text-purple-600 mr-1" />
              {currentMatch.compatibilityScore}%
            </div>
          </div>
        </div>

        {/* Profil-Info */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-secondary">
                {currentMatch.displayName || currentMatch.username}
              </h3>
              <p className="text-tertiary flex items-center">
                {currentMatch.age && (
                  <>
                    <Calendar size={16} className="mr-1" />
                    {currentMatch.age} Jahre
                  </>
                )}
                {currentMatch.distance && (
                  <>
                    <MapPin size={16} className="ml-4 mr-1" />
                    {currentMatch.distance} km entfernt
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Bio */}
          {currentMatch.bio && (
            <p className="text-secondary mb-4 line-clamp-3">
              {currentMatch.bio}
            </p>
          )}

          {/* Gemeinsame Interessen */}
          {currentMatch.commonInterests && currentMatch.commonInterests.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-secondary mb-2">
                Gemeinsame Interessen:
              </h4>
              <div className="flex flex-wrap gap-2">
                {currentMatch.commonInterests.slice(0, 5).map((interest, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                  >
                    {interest.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hobbys */}
          {currentMatch.hobbies && currentMatch.hobbies.length > 0 && (
            <div>
              <h4 className="font-semibold text-secondary mb-2">Hobbys:</h4>
              <div className="flex flex-wrap gap-2">
                {currentMatch.hobbies.slice(0, 6).map((hobby, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {hobby}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Action Buttons
  const renderActionButtons = () => {
    if (currentCardIndex >= potentialMatches.length) return null;

    return (
      <div className="flex justify-center items-center space-x-6 mt-8">
        {/* Skip Button */}
        <button
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors shadow-lg hover:scale-110"
        >
          <X size={24} />
        </button>

        {/* Super Like Button */}
        <button
          onClick={() => handleSwipe('super')}
          className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg hover:scale-110"
        >
          <Star size={20} />
        </button>

        {/* Like Button */}
        <button
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors shadow-lg hover:scale-110"
        >
          <Heart size={24} />
        </button>
      </div>
    );
  };

  // Match Modal
  const renderMatchModal = () => {
    if (!showMatch || !matchData) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-secondary mb-4">
            Es ist ein Match!
          </h2>
          <p className="text-tertiary mb-6">
            Du und {matchData.user.displayName || matchData.user.username} habt euch gegenseitig geliked!
          </p>
          
          {/* Kompatibilitätsscore */}
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center text-purple-700">
              <Sparkles size={24} className="mr-2" />
              <span className="text-2xl font-bold">
                {matchData.match.matchQuality}% Kompatibilität
              </span>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setShowMatch(false)}
              className="flex-1 bg-gray-200 text-secondary px-6 py-3 rounded-lg font-semibold cursor-pointer hover:bg-gray-300 transition-colors"
            >
              Weiter swipen
            </button>
            <button
              onClick={() => {
                setShowMatch(false);
                // Hier könnte Chat geöffnet werden
              }}
              className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer hover:bg-purple-700 transition-colors"
            >
              Nachricht senden
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Statistiken Modal
  const renderStatsModal = () => {
    if (!showStats || !stats) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary">Deine Statistiken</h2>
            <button
              onClick={() => setShowStats(false)}
              className="text-gray-500 cursor-pointer hover:text-secondary"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalSwipes}</div>
              <div className="text-sm text-tertiary">Gesamt Swipes</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalLikes}</div>
              <div className="text-sm text-tertiary">Likes gegeben</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalMatches}</div>
              <div className="text-sm text-tertiary">Matches</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.swipeStreak}</div>
              <div className="text-sm text-tertiary">Swipe Streak</div>
            </div>
          </div>

          {stats.averageMatchQuality > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
              <div className="flex items-center justify-center">
                <Sparkles size={20} className="text-purple-600 mr-2" />
                <span className="text-lg font-semibold">
                  Ø {stats.averageMatchQuality}% Match-Qualität
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Präferenzen Modal
  const renderPreferencesModal = () => {
    if (!showPreferences || !preferences) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary">Swipe-Einstellungen</h2>
            <button
              onClick={() => setShowPreferences(false)}
              className="text-gray-500 cursor-pointer hover:text-secondary"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Altersbereich */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Altersbereich: {preferences.minAge} - {preferences.maxAge} Jahre
              </label>
              <div className="flex space-x-4">
                <input
                  type="range"
                  min="18"
                  max="99"
                  value={preferences.minAge}
                  onChange={(e) => setPreferences({...preferences, minAge: parseInt(e.target.value)})}
                  className="flex-1 cursor-pointer"
                />
                <input
                  type="range"
                  min="18"
                  max="99"
                  value={preferences.maxAge}
                  onChange={(e) => setPreferences({...preferences, maxAge: parseInt(e.target.value)})}
                  className="flex-1 cursor-pointer"
                />
              </div>
            </div>

            {/* Entfernung */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Max. Entfernung: {preferences.maxDistance} km
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={preferences.maxDistance}
                onChange={(e) => setPreferences({...preferences, maxDistance: parseInt(e.target.value)})}
                className="w-full cursor-pointer"
              />
            </div>

            {/* Sichtbarkeit */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary">
                Zeige mich anderen Usern
              </span>
              <button
                onClick={() => setPreferences({...preferences, isVisible: !preferences.isVisible})}
                className={`flex items-center px-3 py-1 cursor-pointer rounded-full ${
                  preferences.isVisible 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-secondary'
                }`}
              >
                {preferences.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                <span className="ml-1">
                  {preferences.isVisible ? 'Sichtbar' : 'Versteckt'}
                </span>
              </button>
            </div>

            {/* Gemeinsame Interessen */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary">
                Gemeinsame Interessen erforderlich
              </span>
              <input
                type="checkbox"
                checked={preferences.requireCommonInterests}
                onChange={(e) => setPreferences({...preferences, requireCommonInterests: e.target.checked})}
                className="w-5 h-5 text-purple-600 cursor-pointer"
              />
            </div>

            {/* Nur aktive User */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary">
                Nur aktive User anzeigen
              </span>
              <input
                type="checkbox"
                checked={preferences.onlyShowActiveUsers}
                onChange={(e) => setPreferences({...preferences, onlyShowActiveUsers: e.target.checked})}
                className="w-5 h-5 text-purple-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-8 flex space-x-4">
            <button
              onClick={() => setShowPreferences(false)}
              className="flex-1 bg-gray-200 text-black px-6 py-3 rounded-lg font-semibold cursor-pointer hover:bg-gray-300 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={async () => {
                await SwipeService.updateSwipePreferences(preferences);
                setShowPreferences(false);
                loadPotentialMatches(); // Neue Matches mit neuen Einstellungen laden
              }}
              className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer hover:bg-purple-700 transition-colors"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-primary flex items-center">
            <Zap className="mr-2 text-purple-600" size={24} />
            Swipe Game
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowStats(true)}
              className="p-2 text-tertiary cursor-pointer transition-colors"
              title="Statistiken"
            >
              <TrendingUp size={20} className='hover:text-purple-600' />
            </button>
            <button
              onClick={() => setShowPreferences(true)}
              className="p-2 text-tertiary cursor-pointer transition-colors"
              title="Einstellungen"
            >
              <Settings size={20} className='hover:text-purple-600' />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-tertiary cursor-pointer transition-colors"
              title="Schließen"
            >
              <X size={20} className='hover:text-red-600' />
            </button>
          </div>
        </div>

        {/* Progress */}
        {potentialMatches.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-tertiary">
                {currentCardIndex + 1} von {potentialMatches.length}
              </span>
              <span className="text-sm text-tertiary">
                {potentialMatches.length - currentCardIndex} übrig
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentCardIndex + 1) / potentialMatches.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Swipe Card */}
        <div className="mb-6">
          {renderCurrentCard()}
        </div>

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Modals */}
        {renderMatchModal()}
        {renderStatsModal()}
        {renderPreferencesModal()}
      </div>
    </div>
  );
};

export default SwipeGame;