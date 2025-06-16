import React, { useState, useEffect } from 'react';

/**
 * ImageViewer Component
 * 
 * A modal component for viewing images in full size
 */
const ImageViewer = ({ src, alt, className, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);
  
  // Update image source if prop changes
  useEffect(() => {
    setImgSrc(src);
    setError(false);
    setIsLoaded(false);
  }, [src]);
  
  // Open the modal
  const openModal = () => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };
  
  // Close the modal
  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = ''; // Restore scrolling
  };
  
  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    setError(false);
  };
  
  // Handle image error
  const handleError = () => {
    console.error('Image failed to load:', src);
    setError(true);
    setIsLoaded(true);
    
    // Try to fetch the image directly as a blob to bypass CORS
    if (!src.startsWith('data:')) {
      fetch(src, { mode: 'cors', credentials: 'omit' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          return response.blob();
        })
        .then(blob => {
          const objectUrl = URL.createObjectURL(blob);
          setImgSrc(objectUrl);
          setError(false);
        })
        .catch(err => {
          console.error('Failed to fetch image as blob:', err);
          // Set a fallback image
          setImgSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRleHQgeD0iNTAiIHk9IjUwIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iI2NjY2NjYyI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==');
        });
    } else {
      // Set a fallback image
      setImgSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRleHQgeD0iNTAiIHk9IjUwIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iI2NjY2NjYyI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==');
    }
  };
  
  return (
    <>
      {/* Thumbnail image */}
      <div className="relative">
        <img
          src={imgSrc}
          alt={alt || 'Image'}
          className={`cursor-pointer ${className || ''} ${error ? 'border border-red-300' : ''}`}
          style={style}
          onClick={openModal}
          onError={handleError}
          onLoad={handleLoad}
          crossOrigin="anonymous"
        />
        {!isLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        {error && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-100 bg-opacity-80 text-xs text-red-700 p-1 text-center">
            Failed to load
          </div>
        )}
      </div>
      
      {/* Modal overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-full max-h-full">
            {/* Loading indicator */}
            {!isLoaded && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
            
            {/* Full size image */}
            <img
              src={imgSrc}
              alt={alt || 'Full size image'}
              className={`max-w-full max-h-[90vh] object-contain ${error ? 'hidden' : ''}`}
              onLoad={handleLoad}
              onError={handleError}
              crossOrigin="anonymous"
            />
            
            {/* Error message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>Failed to load image. The image may be unavailable or you may not have permission to view it.</p>
              </div>
            )}
            
            {/* Close button */}
            <button
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75"
              onClick={closeModal}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageViewer; 