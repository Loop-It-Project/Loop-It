import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const MediaGallery = ({ media }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const imageRef = useRef(null);

  // Touch-Handler für Swipe-Gesten
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && media.length > 1) {
      nextImage();
    }
    if (isRightSwipe && media.length > 1) {
      prevImage();
    }
  };

  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setImageLoading(true);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = (e) => {
    setImageLoading(false);
    e.target.style.backgroundColor = '#1f2937';
    e.target.style.display = 'flex';
    e.target.style.alignItems = 'center';
    e.target.style.justifyContent = 'center';
    e.target.innerHTML = '<div style="color: #9ca3af; font-size: 16px;">❌ Bild konnte nicht geladen werden</div>';
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % media.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  // Escape-Key Handler
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && selectedImageIndex !== null) {
        closeLightbox();
      }
    };

    if (selectedImageIndex !== null) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when lightbox is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [selectedImageIndex]);

  // Click-Outside Handler
  const handleBackdropClick = (event) => {
    // Nur schließen wenn direkt auf den Backdrop geklickt wird
    if (event.target === event.currentTarget) {
      closeLightbox();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (selectedImageIndex === null) return;
  
      switch (event.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          if (media.length > 1) {
            prevImage();
          }
          break;
        case 'ArrowRight':
          if (media.length > 1) {
            nextImage();
          }
          break;
        default:
          return;
      }
      
      event.preventDefault();
    };
  
    if (selectedImageIndex !== null) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
  
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [selectedImageIndex, media.length]);

  if (!media || media.length === 0) return null;

  const getGridClass = () => {
    switch (media.length) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-3';
      case 4:
        return 'grid-cols-2';
      default:
        return 'grid-cols-3';
    }
  };

  // Responsive Bildhöhe basierend auf Seitenverhältnis
  const getImageHeight = (item, isGrid = true) => {
    if (!isGrid) return 'max-h-screen'; // Lightbox - volle Höhe
    
    if (media.length === 1) {
      // Einzelbild - respektiert Seitenverhältnis
      const aspectRatio = item.dimensions?.aspectRatio || 1;
      const maxHeight = aspectRatio > 1.5 ? 'max-h-64' : 'max-h-96';
      return `${maxHeight} w-full`;
    } else {
      // Grid - einheitliche Höhe
      return 'h-48 w-full';
    }
  };

  return (
    <>
      {/* Media Grid */}
      <div className={`grid ${getGridClass()} gap-2 rounded-lg overflow-hidden`}>
        {media.slice(0, 4).map((item, index) => (
          <div
            key={item.id}
            className={`relative cursor-pointer hover:opacity-90 transition-opacity ${
              media.length === 4 && index >= 2 ? 'col-span-1' : ''
            }`}
            onClick={() => openLightbox(index)}
          >
            <img
              src={item.thumbnailUrl || item.url}
              alt={`Media ${index + 1}`}
              className={`${getImageHeight(item, true)} object-cover`}
              style={{
                objectFit: media.length === 1 ? 'contain' : 'cover'
              }}
              onError={(e) => {
                if (e.target.src !== item.url) {
                  e.target.src = item.url;
                } else {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.display = 'flex';
                  e.target.style.alignItems = 'center';
                  e.target.style.justifyContent = 'center';
                  e.target.innerHTML = '<div style="color: #6b7280; font-size: 14px;">❌ Bild nicht verfügbar</div>';
                }
              }}
            />
            
            {/* Show count overlay for 5+ images */}
            {index === 3 && media.length > 4 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  +{media.length - 4}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal mit Click-Outside und verbesserter UX */}
      {selectedImageIndex !== null && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          <div className="relative max-w-full max-h-full">

            {/* Loading Indicator */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-black bg-opacity-50 rounded-lg p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <span className="text-white text-sm">Lade Bild...</span>
                </div>
              </div>
            )}
            
            {/* Close Button - prominenter und benutzerfreundlicher */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-20 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200 hover:scale-110"
              title="Schließen (ESC)"
            >
              <X size={24} />
            </button>

            {/* Navigation Buttons - nur wenn mehrere Bilder */}
            {media.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200 hover:scale-110"
                  title="Vorheriges Bild"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200 hover:scale-110"
                  title="Nächstes Bild"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            {/* Image Container - verhindert Event-Propagation */}
            <div 
              className="relative flex items-center justify-center max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={media[selectedImageIndex].url}
                alt={`Media ${selectedImageIndex + 1}`}
                className={`max-w-full max-h-full object-contain rounded-lg transition-opacity duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                style={{
                  maxHeight: 'calc(100vh - 8rem)',
                  maxWidth: 'calc(100vw - 8rem)'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>

            {/* Mobile Swipe Indicator */}
            {media.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black bg-opacity-50 px-3 py-1 rounded md:hidden">
                ← Wischen für nächstes Bild →
              </div>
            )}

            {/* Counter und Info - nur wenn mehrere Bilder */}
            {media.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {selectedImageIndex + 1} / {media.length}
                </span>
                {media[selectedImageIndex].originalName && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-300 max-w-xs truncate">
                      {media[selectedImageIndex].originalName}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Keyboard Shortcuts Info */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-xs">
              <div className="flex items-center space-x-2">
                <span>ESC</span>
                <span className="text-gray-300">Schließen</span>
                {media.length > 1 && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span>← →</span>
                    <span className="text-gray-300">Navigation</span>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default MediaGallery;