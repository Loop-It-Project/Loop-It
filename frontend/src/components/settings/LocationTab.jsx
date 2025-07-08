import { useNavigate } from 'react-router-dom';

const LocationTab = ({ 
  geoSettings, 
  setGeoSettings, 
  locationLoading, 
  locationError, 
  saving, 
  onSubmit, 
  onGetCurrentLocation 
}) => {
  const navigate = useNavigate();

  const handleRadiusChange = (newRadius) => {
    const radius = Math.max(1, Math.min(500, newRadius));
    setGeoSettings(prev => ({
      ...prev,
      searchRadius: radius
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-primary dark:text-white">Location & Matchmaking</h2>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-secondary dark:text-muted rounded-lg hover:bg-gray-200 hover:cursor-pointer dark:hover:bg-gray-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Location Error */}
      {locationError && (
        <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg">
          {locationError}
        </div>
      )}

      {/* Geo-Tracking Enable/Disable */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-primary dark:border-gray-700 rounded-lg">
          <div>
            <h3 className="font-medium text-primary dark:text-white">Enable Location Tracking</h3>
            <p className="text-sm text-secondary dark:text-muted">Allow us to use your location for matchmaking and nearby users</p>
          </div>
          <label className="relative inline-flex items-center">
            <input
              type="checkbox"
              checked={geoSettings.geoTrackingEnabled}
              onChange={(e) => setGeoSettings(prev => ({
                ...prev,
                geoTrackingEnabled: e.target.checked
              }))}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${
              geoSettings.geoTrackingEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                geoSettings.geoTrackingEnabled ? 'translate-x-6' : 'translate-x-1'
              } mt-1`}></div>
            </div>
          </label>
        </div>

        {/* Location Settings - nur wenn Tracking aktiviert */}
        {geoSettings.geoTrackingEnabled && (
          <div className="space-y-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            
            {/* Current Location */}
            <div>
              <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-3">
                Current Location
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onGetCurrentLocation}
                  disabled={locationLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {locationLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Getting Location...
                    </>
                  ) : (
                    <>
                      📍 Get Current Location
                    </>
                  )}
                </button>
                
                {geoSettings.currentLocation && (
                  <div className="text-sm text-secondary dark:text-muted">
                    Lat: {geoSettings.currentLocation.lat.toFixed(4)}, 
                    Lng: {geoSettings.currentLocation.lng.toFixed(4)}
                    {geoSettings.currentLocation.accuracy && (
                      <span className="block">Accuracy: ±{Math.round(geoSettings.currentLocation.accuracy)}m</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Search Radius */}
            <div>
              <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-3">
                Search Radius: {geoSettings.searchRadius} km
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={geoSettings.searchRadius}
                  onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-tertiary dark:text-muted">
                  <span>1 km</span>
                  <span>100 km</span>
                  <span>500 km</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={geoSettings.searchRadius}
                  onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                  className="w-24 px-3 py-1 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded text-sm"
                />
              </div>
            </div>

            {/* Location Visibility */}
            <div>
              <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-3">
                Who can see your location?
              </label>
              <div className="space-y-2">
                {[
                  { value: 'private', label: 'Nobody (Distance only)', description: 'Others only see distance, not exact location' },
                  { value: 'friends', label: 'Friends only', description: 'Only your friends can see your location' },
                  { value: 'public', label: 'Everyone', description: 'All users can see your general location' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-hover dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="radio"
                      name="locationVisibility"
                      value={option.value}
                      checked={geoSettings.locationVisibility === option.value}
                      onChange={(e) => setGeoSettings(prev => ({
                        ...prev,
                        locationVisibility: e.target.value
                      }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-primary dark:text-white">{option.label}</div>
                      <div className="text-sm text-secondary dark:text-muted">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Location Accuracy */}
            <div>
              <label className="block text-sm font-medium text-secondary dark:text-gray-300 mb-3">
                Location Accuracy
              </label>
              <select
                value={geoSettings.geoTrackingAccuracy}
                onChange={(e) => setGeoSettings(prev => ({
                  ...prev,
                  geoTrackingAccuracy: e.target.value
                }))}
                className="w-full px-4 py-2 border border-secondary dark:border-gray-600 bg-card dark:bg-gray-700 text-primary dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="region">Region only (~50km accuracy)</option>
                <option value="city">City level (~10km accuracy)</option>
                <option value="exact">Exact location (GPS accuracy)</option>
              </select>
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={geoSettings.autoUpdateLocation}
                  onChange={(e) => setGeoSettings(prev => ({
                    ...prev,
                    autoUpdateLocation: e.target.checked
                  }))}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-primary dark:text-white">Auto-update location</span>
                  <p className="text-xs text-secondary dark:text-muted">Automatically update your location when you move</p>
                </div>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={geoSettings.showDistanceToOthers}
                  onChange={(e) => setGeoSettings(prev => ({
                    ...prev,
                    showDistanceToOthers: e.target.checked
                  }))}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-primary dark:text-white">Show distance to other users</span>
                  <p className="text-xs text-secondary dark:text-muted">Display how far away other users are from you</p>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Save Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 hover:cursor-pointer transition-colors"
        >
          Back to Dashboard
        </button>
        
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:cursor-pointer transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Location Settings'}
        </button>
      </div>
    </form>
  );
};

export default LocationTab;