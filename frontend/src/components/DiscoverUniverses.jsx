import { useState, useEffect } from 'react';
import { Search, Filter, Users, MessageSquare, Calendar, X, Check, Hash, Crown } from 'lucide-react';
import UniverseService from '../services/universeService';

const DiscoverUniverses = ({ onUniverseClick, onUniverseJoined }) => {
  const [universes, setUniverses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    sortBy: 'popular', // popular, newest, active
    showJoined: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([
    'technology', 'sports', 'music', 'art', 
    'gaming', 'cooking', 'travel', 'fitness', 
    'photography', 'books', 'movies', 'science'
  ]);

  // Load universes
  useEffect(() => {
    loadUniverses(1);
  }, [filters]);

  const loadUniverses = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await UniverseService.discoverUniverses(
        filters.category, 
        pageNum, 
        20, 
        filters.sortBy
      );
      
      if (response.success) {
        if (pageNum === 1) {
          setUniverses(response.data.universes || []);
        } else {
          setUniverses(prev => [...prev, ...(response.data.universes || [])]);
        }
        setHasMore(response.data.hasMore || false);
        setPage(pageNum);
      } else {
        setError(response.error || 'Fehler beim Laden der Universes');
      }
    } catch (error) {
      console.error('Error loading universes:', error);
      setError('Fehler beim Laden der Universes');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(1);
  };

  // Handle join universe
  const handleJoinUniverse = async (universeId) => {
    try {
      setJoiningUniverse(universeId);
      
      const response = await UniverseService.joinUniverse(universeId);
      
      if (response.success) {
        // Update local state
        setUniverses(prev => prev.map(universe => 
          universe.id === universeId 
            ? { ...universe, isMember: true, memberCount: universe.memberCount + 1 }
            : universe
        ));

        // Callback an Dashboard weiterleiten
        if (onUniverseJoined) {
          onUniverseJoined(response.data.universe.slug);
        }

        console.log('✅ Successfully joined universe');
      } else {
        console.error('❌ Failed to join universe:', response.error);
      }
    } catch (error) {
      console.error('Error joining universe:', error);
    } finally {
      setJoiningUniverse(null);
    }
  };

  // Handle leave universe
    const handleLeaveUniverse = async (universeSlug, e) => {
      e.stopPropagation();
    
      if (!confirm('Möchtest du dieses Universe wirklich verlassen?')) {
        return;
      }

      try {
        const result = await UniverseService.leaveUniverse(universeSlug);

        if (result.success) {
          // Update UI state
          setUniverses(prev => 
            prev.map(universe => 
              universe.slug === universeSlug 
                ? { ...universe, isMember: false, memberCount: Math.max(0, universe.memberCount - 1) }
                : universe
            )
          );
        } else {
          alert('Fehler beim Verlassen des Universe: ' + result.error);
        }
      } catch (error) {
        console.error('Error leaving universe:', error);
        alert('Fehler beim Verlassen des Universe');
      }
    };

  // Filter universes by search term
  const filteredUniverses = universes.filter(universe => {

//     console.log('🔍 Filter Debug:', {
//     slug: universe.slug,
//     isMember: universe.isMember,
//     isOwner: universe.isOwner,
//     showJoined: filters.showJoined,
//     shouldShow: filters.showJoined || (!universe.isMember && !universe.isOwner)
//   });

      // Suchbegriff-Filter
      const matchesSearch = 
        universe.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        universe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        universe.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    
      // Mitgliedschafts-Filter: Wenn showJoined true ist, zeige alle Universes
      // Wenn showJoined false ist, zeige nur Universes, in denen der User NICHT Mitglied ist
      const passesJoinedFilter = filters.showJoined || (!universe.isMember && !universe.isOwner);
    
      // Beide Filter müssen erfüllt sein
      return matchesSearch && passesJoinedFilter;
    });

  // Load more universes
  const loadMoreUniverses = () => {
    if (!loading && hasMore) {
      loadUniverses(page + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg shadow-sm border p-4 mb-6">
        <h2 className="text-xl font-bold text-primary mb-4">Universes entdecken</h2>
        
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary" size={20} />
            <input
              type="text"
              placeholder="Universes durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-input border border-primary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Filter Toggle Button */}
        <div className="flex justify-end">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-tertiary cursor-pointer hover:text-secondary transition-colors"
          >
            <Filter size={16} />
            <span className="text-sm">Filter {showFilters ? 'ausblenden' : 'anzeigen'}</span>
          </button>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-secondary bg-opacity-5 rounded-lg border border-secondary border-opacity-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Kategorie
                </label>
                <select 
                  value={filters.category} 
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full p-2 bg-input border border-primary rounded-lg text-primary"
                >
                  <option value="">Alle Kategorien</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Sort By Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Sortieren nach
                </label>
                <select 
                  value={filters.sortBy} 
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full p-2 bg-input border border-primary rounded-lg text-primary"
                >
                  <option value="popular">Beliebtheit</option>
                  <option value="newest">Neueste</option>
                  <option value="active">Aktivität</option>
                </select>
              </div>
              
              {/* Show Joined Toggle */}
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={filters.showJoined}
                    onChange={(e) => handleFilterChange('showJoined', e.target.checked)}
                  />
                  <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${filters.showJoined ? 'bg-purple-600' : 'bg-gray-300'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${filters.showJoined ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-secondary">
                    Auch beigetretene Universes zeigen
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Universe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUniverses.map((universe) => (
          <div 
            key={universe.id} 
            className="bg-card rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onUniverseClick(universe.slug)}
          >
            <div className="p-5">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                  <Hash className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-primary mb-1">#{universe.slug}</h3>
                  <p className="text-secondary mb-3 line-clamp-2">{universe.description || "Keine Beschreibung"}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-tertiary text-sm">
                    <div className="flex items-center">
                      <Users size={16} className="mr-1" />
                      <span>{universe.memberCount} Mitglieder</span>
                    </div>
                    
                    <div className="flex items-center">
                      <MessageSquare size={16} className="mr-1" />
                      <span>{universe.postCount} Posts</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      <span>{new Date(universe.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Join/Joined/Leave Button */}
                <div className="ml-4">
                  {universe.isOwner ? (
                    // Wenn User der Owner ist, zeige "Owner" Badge
                    <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      <Crown size={14} className="mr-1" />
                      <span>Owner</span>
                    </div>
                  ) : universe.isMember ? (
                    // Wenn User Mitglied ist, zeige "Verlassen" Button
                    <button
                      onClick={(e) => handleLeaveUniverse(universe.slug, e)}
                      className="px-3 py-1 bg-red-600 text-white rounded-full text-sm cursor-pointer hover:bg-red-700 transition-colors"
                    >
                      Verlassen
                    </button>
                  ) : (
                    // Wenn User weder Owner noch Mitglied ist, zeige "Beitreten" Button
                    <button
                      onClick={(e) => handleJoinUniverse(universe.slug, e)}
                      className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm cursor-pointer hover:bg-purple-700 transition-colors"
                    >
                      Beitreten
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="text-center py-4 text-red-500">
          <p>{error}</p>
        </div>
      )}
      
      {/* Load More Button */}
      {!loading && hasMore && (
        <div className="text-center py-4">
          <button
            onClick={loadMoreUniverses}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors"
          >
            Mehr laden
          </button>
        </div>
      )}
      
      {/* No Results */}
      {!loading && filteredUniverses.length === 0 && !error && (
        <div className="text-center py-12 text-tertiary">
          <p className="text-lg">Keine Universes gefunden</p>
          <p className="text-sm mt-2">
            {searchTerm ? 'Versuche einen anderen Suchbegriff.' : 'Momentan sind keine Universes verfügbar.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default DiscoverUniverses;