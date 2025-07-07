import { useState, useRef, useEffect } from 'react';
import { 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageCircle, 
  Send, 
  Mail,
  Copy,
  Check,
  ExternalLink,
  MoreHorizontal 
} from 'lucide-react';
import ShareService from '../../services/shareService';
import useEscapeKey from '../../hooks/useEscapeKey';

const ShareButton = ({ post, onShareComplete, compact = false }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const shareRef = useRef(null);

  // ESC-Key Handler
  useEscapeKey(() => setShowShareMenu(false), showShareMenu);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareRef.current && !shareRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

  // Share platforms configuration
  const sharePlatforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600 hover:text-blue-700',
      bgColor: 'hover:bg-blue-50'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'text-sky-500 hover:text-sky-600',
      bgColor: 'hover:bg-sky-50'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700 hover:text-blue-800',
      bgColor: 'hover:bg-blue-50'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600 hover:text-green-700',
      bgColor: 'hover:bg-green-50'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: Send,
      color: 'text-sky-600 hover:text-sky-700',
      bgColor: 'hover:bg-sky-50'
    },
    {
      id: 'email',
      name: 'E-Mail',
      icon: Mail,
      color: 'text-gray-600 hover:text-gray-700',
      bgColor: 'hover:bg-gray-50'
    }
  ];

  // Handle platform share
  const handlePlatformShare = async (platform) => {
    setSharing(true);
    setShareSuccess('');

    try {
      // Generate share URL
      const shareUrl = ShareService.generateShareUrl(platform, post);
      
      // Track share
      const trackResult = await ShareService.sharePost(post.id, platform, {
        url: shareUrl,
        timestamp: new Date().toISOString()
      });

      if (trackResult.success) {
        // Open share URL
        window.open(shareUrl, '_blank', 'width=600,height=400');
        
        setShareSuccess(`Auf ${platform} geteilt!`);
        
        // Notify parent component
        if (onShareComplete) {
          onShareComplete(platform, trackResult.data.shareCount);
        }

        // Auto-hide success message
        setTimeout(() => {
          setShareSuccess('');
          setShowShareMenu(false);
        }, 2000);
      } else {
        console.error('Share tracking failed:', trackResult.error);
        // Still open share URL even if tracking fails
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setSharing(false);
    }
  };

  // Handle copy link
  const handleCopyLink = async () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    
    const copyResult = await ShareService.copyToClipboard(postUrl);
    
    if (copyResult.success) {
      setCopied(true);
      
      // Track copy action
      await ShareService.sharePost(post.id, 'copy_link', {
        url: postUrl,
        timestamp: new Date().toISOString()
      });

      // Reset copied state
      setTimeout(() => {
        setCopied(false);
        setShowShareMenu(false);
      }, 2000);

      if (onShareComplete) {
        onShareComplete('copy_link');
      }
    }
  };

  // Handle native share
  const handleNativeShare = async () => {
      const shareData = {
        title: post.title || 'Interessanter Post auf Loop-It',
        text: post.content?.substring(0, 150) + (post.content?.length > 150 ? '...' : ''),
        url: `${window.location.origin}/post/${post.id}`
      };

      const nativeResult = await ShareService.nativeShare(shareData);

      if (nativeResult.success && nativeResult.shared) {
        const trackResult = await ShareService.sharePost(post.id, 'native', {
          timestamp: new Date().toISOString()
        });

        if (trackResult.success && onShareComplete) {
          onShareComplete('native', trackResult.data.shareCount);
        } else if (onShareComplete) {
          // Fallback wenn tracking fehlschlägt
          onShareComplete('native');
        }
      } else if (!nativeResult.success) {
        // Fallback to share menu if native sharing fails
        setShowShareMenu(true);
      }
    };

  // Check if native sharing is available
  const hasNativeShare = navigator.share;

  if (compact) {
    return (
      <button
        onClick={hasNativeShare ? handleNativeShare : () => setShowShareMenu(!showShareMenu)}
        className="flex items-center space-x-2 text-tertiary hover:text-green-500 hover:cursor-pointer transition-colors"
        title="Post teilen"
      >
        <Share2 size={20} />
        <span className="text-sm font-medium">{post.shareCount || 0}</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={shareRef}>
      <button
        onClick={hasNativeShare ? handleNativeShare : () => setShowShareMenu(!showShareMenu)}
        className="flex items-center space-x-2 text-tertiary hover:text-green-500 hover:cursor-pointer transition-colors"
        disabled={sharing}
      >
        <Share2 size={20} className={sharing ? 'animate-pulse' : ''} />
        <span className="text-sm font-medium">{post.shareCount || 0}</span>
      </button>

      {/* Share Menu */}
      {showShareMenu && (
        <div className="absolute bottom-full right-0 mb-2 bg-card border border-primary rounded-lg shadow-lg py-2 min-w-[240px] z-50">
          {/* Header */}
          <div className="px-4 py-2 border-b border-primary">
            <h4 className="text-sm font-semibold text-primary">Post teilen</h4>
          </div>

          {/* Success Message */}
          {shareSuccess && (
            <div className="px-4 py-2 bg-green-50 border-b border-green-200">
              <div className="flex items-center space-x-2 text-green-700">
                <Check size={16} />
                <span className="text-sm">{shareSuccess}</span>
              </div>
            </div>
          )}

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-secondary hover:cursor-pointer transition-colors"
          >
            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
            <span className="text-sm">
              {copied ? 'Link kopiert!' : 'Link kopieren'}
            </span>
          </button>

          {/* Platforms */}
          <div className="border-t border-primary">
            {sharePlatforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handlePlatformShare(platform.id)}
                disabled={sharing}
                className={`w-full flex items-center space-x-3 px-4 py-3 ${platform.bgColor} hover:cursor-pointer transition-colors disabled:opacity-50`}
              >
                <platform.icon size={18} className={platform.color} />
                <span className="text-sm text-secondary">{platform.name}</span>
                <ExternalLink size={14} className="text-tertiary ml-auto" />
              </button>
            ))}
          </div>

          {/* Additional Options */}
          <div className="border-t border-primary px-4 py-2">
            <button className="w-full flex items-center space-x-3 py-2 text-tertiary hover:text-secondary hover:cursor-pointer transition-colors">
              <MoreHorizontal size={18} />
              <span className="text-sm">Mehr Optionen</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;