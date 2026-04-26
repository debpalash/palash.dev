import React, { useState, useEffect } from 'react';

export default function HoverSlider({ 
  logoUrl, 
  icon, 
  screenshots, 
  alt 
}: { 
  logoUrl?: string; 
  icon?: string; 
  screenshots: string[]; 
  alt: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isHovered && screenshots.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % screenshots.length);
      }, 1500);
    } else {
      setCurrentIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, screenshots.length]);

  return (
    <div 
      style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base Logo */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          opacity: (isHovered && screenshots.length > 0) ? 0 : 1,
          transition: 'opacity 0.4s ease',
          zIndex: 10
        }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={alt} className="project-logo-image" style={{ maxWidth: '140px', maxHeight: '140px', objectFit: 'contain' }} />
        ) : (
          <div className="project-logo-image" style={{ fontSize: '6rem' }}>{icon}</div>
        )}
      </div>

      {/* Screenshots Slider */}
      {screenshots.length > 0 && (
        <div 
          style={{ 
            position: 'absolute', 
            inset: 0, 
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.6s ease',
            zIndex: 5
          }}
        >
          {screenshots.map((src, index) => (
            <img 
              key={src} 
              src={src} 
              alt={`${alt} screenshot ${index + 1}`} 
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: currentIndex === index ? 1 : 0,
                transform: currentIndex === index ? 'scale(1)' : 'scale(1.05)',
                transition: 'opacity 0.8s ease, transform 3s ease-out'
              }}
            />
          ))}
          {/* Subtle dark overlay to match the premium theme */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', zIndex: 6, pointerEvents: 'none' }} />
        </div>
      )}
    </div>
  );
}
