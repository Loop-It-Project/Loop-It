import { User, Hash } from 'lucide-react';

const FriendsList = ({ friends, onFriendClick }) => {
  if (!friends || friends.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-primary">
      <h3 className="font-semibold text-primary mb-4">
        Freunde mit gemeinsamen Interessen
      </h3>
      
      <div className="space-y-4">
        {friends.map((friend) => (
          <div
            key={friend.id}
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-hover transition-colors cursor-pointer"
            onClick={() => onFriendClick(friend.username)}
          >
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="text-white" size={16} />
            </div>

            {/* Friend Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-primary truncate">
                {friend.displayName || friend.username}
              </h4>
              <p className="text-sm text-tertiary truncate">
                @{friend.username}
              </p>

              {/* Common Interests/Hobbies */}
              {(friend.commonInterests?.length > 0 || friend.commonHobbies?.length > 0) && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {friend.commonInterests?.slice(0, 2).map((interest, index) => (
                      <span
                        key={`interest-${index}`}
                        className="inline-flex items-center space-x-1 bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs"
                      >
                        <span>{interest}</span>
                      </span>
                    ))}
                    {friend.commonHobbies?.slice(0, 2).map((hobby, index) => (
                      <span
                        key={`hobby-${index}`}
                        className="inline-flex items-center space-x-1 bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs"
                      >
                        <Hash size={10} />
                        <span>{hobby}</span>
                      </span>
                    ))}
                    
                    {/* Show count if more interests/hobbies */}
                    {(friend.commonInterests?.length + friend.commonHobbies?.length) > 4 && (
                      <span className="text-xs text-tertiary">
                        +{(friend.commonInterests?.length + friend.commonHobbies?.length) - 4} weitere
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendsList;