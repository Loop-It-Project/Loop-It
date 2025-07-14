import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  Globe,
  Edit3, 
  Filter,
  MessageCircle,
  Hash,
  Github,
  Twitter,
  Instagram,
  Linkedin,
  Link as LinkIcon
} from 'lucide-react';
import UserService from '../services/userService';
import UserProfileService from '../services/userProfileService';
import PostCard from '../components/feed/PostCard';
import EditProfileModal from '../components/EditProfileModal';
import FriendsList from '../components/FriendsList';
import FriendshipButton from '../components/FriendshipButton';
import FriendsModal from '../components/FriendsModal';
import ChatButton from '../components/ChatButton';

const UserProfile = ({ currentUser }) => {
  const { username } = useParams();
  const navigate = useNavigate();
  const isOwnProfile = currentUser?.username === username;

  // State
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState('');
  const [friendshipStatus, setFriendshipStatus] = useState('none');

  // Posts Pagination & Filter
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // State für Friends Modal
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  // Filter Optionen
  const filterOptions = [
    { value: 'newest', label: 'Neueste zuerst', icon: '🆕' },
    { value: 'oldest', label: 'Älteste zuerst', icon: '📅' },
    { value: 'likes', label: 'Meiste Likes', icon: '❤️' },
  ];

  // Social Media Icons
  const getSocialIcon = (platform) => {
    switch (platform) {
      case 'twitter': return <Twitter size={16} />;
      case 'github': return <Github size={16} />;
      case 'instagram': return <Instagram size={16} />;
      case 'linkedin': return <Linkedin size={16} />;
      default: return <LinkIcon size={16} />;
    }
  };

  // Profile laden
  useEffect(() => {
    loadProfile();
  }, [username]);

  // Posts laden
  useEffect(() => {
    loadPosts(1, true);
  }, [username, sortBy]);

  // Freunde laden (nur für eigenes Profil)
  useEffect(() => {
    if (isOwnProfile) {
      loadFriends();
    }
  }, [isOwnProfile]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const profileResponse = await UserService.getPublicUserProfile(username);
      if (!profileResponse.success) {
        setError(profileResponse.error || 'User not found');
        return;
      }

      setProfile(profileResponse.data);

      const statsResponse = await UserProfileService.getUserStats(username);
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

    } catch (error) {
      console.error('Load profile error:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (pageNum = 1, reset = false) => {
    try {
      setPostsLoading(true);

      const response = await UserProfileService.getUserPosts(username, pageNum, 20, sortBy);
      
      if (response.success) {
        const newPosts = response.data.posts;
        
        if (reset) {
          setPosts(newPosts);
          setPage(1);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
        
        setHasMore(response.data.pagination.hasMore);
        if (!reset) setPage(pageNum);
      }
    } catch (error) {
      console.error('Load posts error:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await UserProfileService.getFriendsWithCommonInterests(10);
      if (response.success) {
        setFriends(response.data);
      }
    } catch (error) {
      console.error('Load friends error:', error);
    }
  };

  const handleFilterChange = (newSortBy) => {
    setSortBy(newSortBy);
    setShowFilterDropdown(false);
  };

  const handleLoadMore = () => {
    if (hasMore && !postsLoading) {
      loadPosts(page + 1);
    }
  };

  const handleHashtagClick = (targetUniverseSlug, hashtag) => {
    navigate(`/universe/${targetUniverseSlug}?hashtag=${hashtag}`);
  };

  const handleUniverseClick = (universeSlug) => {
    navigate(`/universe/${universeSlug}`);
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(prev => ({ ...prev, ...updatedProfile }));
    setShowEditModal(false);
  };

  const handleFriendshipStatusChange = (newStatus) => {
    setFriendshipStatus(newStatus);
    // Optional: Profile neu laden für aktualisierte Friend Counts
    if (newStatus === 'accepted' || newStatus === 'none') {
      loadProfile();
    }
  };

  const handleFriendClick = (friendUsername) => {
    if (friendUsername === 'show-all') {
      setShowFriendsModal(true);
    } else {
      navigate(`/profile/${friendUsername}`);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-48 bg-hover rounded-lg mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-hover rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-hover rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <User size={48} className="mx-auto mb-2" />
            <p className="text-lg font-semibold">{error}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-card rounded-lg p-8 mb-8 border border-primary">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="text-white" size={48} />
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-primary">
                  {profile?.displayName || profile?.username}
                </h1>
                <p className="text-secondary">@{profile?.username}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                {/* Chat Button - nur für fremde Profile */}
                {!isOwnProfile && (
                  <ChatButton 
                    targetUser={profile}
                    currentUser={currentUser}
                  />
                )}

                {/* Friendship Button (nur für andere Profile) */}
                {!isOwnProfile && (
                  <FriendshipButton
                    targetUsername={username}
                    currentUser={currentUser}
                    onStatusChange={handleFriendshipStatusChange}
                  />
                )}

              {/* Edit Button (nur für eigenes Profil) */}
              {isOwnProfile && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-purple-700 transition-colors"
                >
                  <Edit3 size={16} />
                  <span>Profil bearbeiten</span>
                </button>
              )}
              </div>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="text-secondary mb-4 max-w-2xl">
                {profile.bio}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-tertiary mb-4">
              <div className="flex items-center space-x-1">
                <Calendar size={16} />
                <span>Mitglied seit {new Date(profile?.createdAt).toLocaleDateString('de-DE', { 
                  year: 'numeric', 
                  month: 'long' 
                })}</span>
              </div>

              {profile?.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-purple-600 hover:text-purple-700"
                >
                  <Globe size={16} />
                  <span>Website</span>
                </a>
              )}
            </div>

            {/* Social Links */}
            {profile?.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
              <div className="flex items-center space-x-3 mb-4">
                {Object.entries(profile.socialLinks).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    {getSocialIcon(platform)}
                    <span className="capitalize">{platform}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Hobbys als klickbare Hashtags */}
            {profile?.hobbies && profile.hobbies.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-secondary mb-2">
                  Hobbys ({profile.hobbies.length}):
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.map((hobby, index) => (
                    <button
                      key={index}
                      onClick={() => handleHashtagClick('hobby', hobby)}
                      className="inline-flex items-center space-x-1 bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm hover:bg-purple-200 transition-colors"
                    >
                      <Hash size={12} />
                      <span>{hobby}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          
          {/* Stats */}
            {stats && (
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-primary">{stats.totalPosts || 0}</div>
                  <div className="text-tertiary">Posts</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-primary">{stats.totalLikes || 0}</div>
                  <div className="text-tertiary">Likes</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-primary">{stats.totalUniverses || 0}</div>
                  <div className="text-tertiary">Universes</div>
                </div>
                <div className="text-center">
                  <button
                    onClick={() => setShowFriendsModal(true)}
                    className="hover:bg-hover rounded-lg p-2 cursor-pointer transition-colors group"
                  >
                    <div className="font-semibold text-primary group-hover:text-purple-600 transition-colors">
                      {stats.totalFriends || 0}
                    </div>
                    <div className="text-tertiary group-hover:text-purple-600 transition-colors">
                      Freunde
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Posts Section */}
        <div className="lg:col-span-2">
          {/* Posts Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-primary">
              Posts von {profile?.displayName || profile?.username}
            </h2>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center space-x-2 px-3 py-2 bg-card border border-secondary rounded-lg hover:bg-secondary transition-colors"
              >
                <Filter size={16} />
                <span className="text-sm font-medium">
                  {filterOptions.find(opt => opt.value === sortBy)?.label || 'Sortieren'}
                </span>
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 top-12 bg-card border border-primary rounded-lg shadow-lg py-2 min-w-[180px] z-10">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange(option.value)}
                      className={`w-full px-4 py-2 text-left hover:bg-secondary transition-colors text-sm flex items-center space-x-2 ${
                        sortBy === option.value ? 'text-purple-600 bg-purple-50' : 'text-secondary'
                      }`}
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-6">
            {posts.length === 0 && !postsLoading ? (
              <div className="text-center py-12">
                <div className="text-tertiary">
                  <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Noch keine Posts</p>
                  <p className="text-sm">
                    {isOwnProfile 
                      ? 'Du hast noch keine Posts erstellt. Teile deine ersten Gedanken!' 
                      : `${profile?.displayName || profile?.username} hat noch nichts gepostet.`
                    }
                  </p>
                </div>
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onUniverseClick={handleUniverseClick}
                    onHashtagClick={handleHashtagClick}
                    showUserInfo={false}
                  />
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center py-6">
                    <button
                      onClick={handleLoadMore}
                      disabled={postsLoading}
                      className="bg-hover text-secondary px-6 py-3 rounded-lg hover:bg-tertiary transition-colors disabled:opacity-50 flex items-center space-x-2 mx-auto"
                    >
                      {postsLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                          <span>Lade mehr...</span>
                        </>
                      ) : (
                        <span>Mehr Posts laden</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Freunde Liste */}
          <FriendsList 
            username={username}
            currentUser={currentUser}
            onFriendClick={handleFriendClick}
            onShowAllClick={() => setShowFriendsModal(true)}
          />

            {/* Interessen (falls vorhanden) */}
            {profile?.interests && profile.interests.length > 0 && (
              <div className="bg-card rounded-lg p-6 border border-primary">
                <h3 className="font-semibold text-primary mb-4">
                  Interessen ({profile.interests.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Activity Stats */}
          <div className="bg-card rounded-lg p-6 border border-primary">
            <h3 className="font-semibold text-primary mb-4">Aktivität</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Posts diese Woche</span>
                <span className="text-sm font-medium text-primary">
                  {posts.filter(post => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(post.createdAt) > weekAgo;
                  }).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Durchschn. Likes</span>
                <span className="text-sm font-medium text-primary">
                  {posts.length > 0 ? Math.round(posts.reduce((sum, post) => sum + (post.likeCount || 0), 0) / posts.length) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={handleProfileUpdate}
        />
      )}

      {/* FRIENDS MODAL */}
      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        username={username}
        currentUser={currentUser}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
};

export default UserProfile;