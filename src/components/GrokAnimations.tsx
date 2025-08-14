import React from 'react';

// Floating Animation Component
export const FloatingStars = () => {
  const elements = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * 15,
    size: Math.random() * 4 + 2,
    opacity: Math.random() * 0.6 + 0.2,
    type: Math.random() > 0.7 ? 'diamond' : Math.random() > 0.5 ? 'circle' : 'star',
    color: Math.random() > 0.6 ? 'blue' : Math.random() > 0.3 ? 'purple' : 'pink',
  }));

  const getElementClass = (element: any) => {
    const baseClass = 'absolute animate-float-down';
    const shapeClass = {
      circle: 'rounded-full',
      diamond: 'rotate-45 rounded-sm',
      star: 'rounded-full',
    }[element.type];

    return `${baseClass} ${shapeClass}`;
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {elements.map((element) => (
        <div
          key={element.id}
          className={getElementClass(element)}
          style={{
            left: `${element.left}%`,
            animationDelay: `${element.animationDelay}s`,
            animationDuration: `${10 + Math.random() * 6}s`,
          }}
        >
          <div
            className={`bg-gradient-to-r ${
              element.color === 'blue'
                ? 'from-blue-400 to-cyan-400'
                : element.color === 'purple'
                  ? 'from-purple-400 to-violet-500'
                  : 'from-pink-400 to-rose-500'
            } ${element.type === 'star' ? 'blur-sm animate-pulse' : 'blur-[1px]'} ${
              element.type === 'diamond' ? 'rotate-45' : 'rounded-full'
            }`}
            style={{
              width: `${element.size}px`,
              height: `${element.size}px`,
              opacity: element.opacity,
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Grok-style Background Gradient
export const GrokBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '2s' }}
      />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
    </div>
  );
};

// Interactive Floating Particles (more advanced version)
export const InteractiveParticles = () => {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    animationDelay: Math.random() * 8,
    size: Math.random() * 6 + 3,
    opacity: Math.random() * 0.4 + 0.3,
    duration: Math.random() * 4 + 6,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-grok-float"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.animationDelay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        >
          <div
            className="rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 blur-sm animate-grok-pulse"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Grok-style Login Card Wrapper
export const GrokLoginWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Grok-style Background */}
      <GrokBackground />
      
      {/* Floating Stars Animation */}
      <FloatingStars />
      
      {/* Interactive Particles */}
      <InteractiveParticles />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
