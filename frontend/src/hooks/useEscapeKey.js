import { useEffect } from 'react';

const useEscapeKey = (callback, condition = true, options = {}) => {
  const { 
    preventDefault = true, 
    stopPropagation = false,
    priority = false // Für wichtige Modals (z.B. unsaved changes)
  } = options;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && condition) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        callback();
      }
    };

    if (condition) {
      document.addEventListener('keydown', handleKeyDown, priority ? { capture: true } : false);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, priority ? { capture: true } : false);
    };
  }, [callback, condition, preventDefault, stopPropagation, priority]);
};

export default useEscapeKey;