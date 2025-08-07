// Particle Effects - Visual feedback system
// Self-contained DOM manipulations for particles and effects

class ParticleEffects {
    constructor() {
        this.initializeFloatingParticles();
    }
    
    // Initialize the enhanced floating particles system
    initializeFloatingParticles() {
        const container = document.getElementById('particles');
        if (!container) return;
        
        const colors = ['golden', 'purple', 'silver'];
        
        for (let i = 0; i < 60; i++) {
            const particle = document.createElement('div');
            particle.className = `particle ${colors[Math.floor(Math.random() * colors.length)]}`;
            
            // Random size between 1px and 6px
            const size = Math.random() * 5 + 1;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Random horizontal position
            particle.style.left = Math.random() * 100 + '%';
            
            // Random animation delay
            particle.style.animationDelay = Math.random() * 30 + 's';
            
            // Random animation duration between 20-40 seconds
            particle.style.animationDuration = (Math.random() * 20 + 20) + 's';
            
            // Random horizontal drift
            particle.style.setProperty('--drift', (Math.random() - 0.5) * 200 + 'px');
            
            container.appendChild(particle);
        }
    }
    
    createMoveParticles(row, col) {
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!square) return;
        
        const rect = square.getBoundingClientRect();
        
        // Position relative to the exact center of the square
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create 6-8 sparkle particles
        const numParticles = Math.random() * 3 + 6;
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'move-particle';
            
            // Larger size and more vibrant colors
            const size = Math.random() * 8 + 6;
            const colors = [
                'rgba(138, 43, 226, 1)', 
                'rgba(222, 184, 135, 1)', 
                'rgba(255, 255, 255, 1)',
                'rgba(46, 204, 113, 0.9)'
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.background = `radial-gradient(circle, ${color}, rgba(255,255,255,0.3))`;
            particle.style.position = 'fixed';
            particle.style.left = (centerX + (Math.random() - 0.5) * 20) + 'px';
            particle.style.top = (centerY + (Math.random() - 0.5) * 20) + 'px';
            particle.style.boxShadow = `0 0 15px ${color}, 0 0 30px ${color}`;
            particle.style.zIndex = '100';
            
            document.body.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }
    
    createCaptureParticles(row, col) {
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!square) return;
        
        const rect = square.getBoundingClientRect();
        
        // Position relative to the exact center of the square
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create 12-16 dramatic burst particles
        const numParticles = Math.random() * 5 + 12;
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'capture-particle';
            
            // Much larger size and more dramatic colors
            const size = Math.random() * 12 + 8;
            const colors = [
                'rgba(231, 76, 60, 1)', 
                'rgba(138, 43, 226, 1)', 
                'rgba(241, 196, 15, 1)',
                'rgba(255, 69, 0, 1)',
                'rgba(220, 20, 60, 1)'
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.background = `radial-gradient(circle, ${color}, rgba(255,255,255,0.4))`;
            particle.style.position = 'fixed';
            particle.style.left = (centerX + (Math.random() - 0.5) * 30) + 'px';
            particle.style.top = (centerY + (Math.random() - 0.5) * 30) + 'px';
            particle.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}, 0 0 60px ${color}`;
            particle.style.zIndex = '100';
            
            document.body.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1500);
        }
    }
    
    createCheckmateExplosion() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Create 40-60 massive explosion particles
        const numParticles = Math.random() * 21 + 40;
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'checkmate-particle';
            
            // Very large particles
            const size = Math.random() * 25 + 15;
            const colors = [
                'rgba(233, 30, 99, 1)', 
                'rgba(255, 87, 34, 1)', 
                'rgba(138, 43, 226, 1)',
                'rgba(255, 215, 0, 1)',
                'rgba(255, 69, 0, 1)',
                'rgba(220, 20, 60, 1)',
                'rgba(255, 255, 255, 1)'
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Random direction for explosion
            const angle = (Math.PI * 2 * i) / numParticles + (Math.random() - 0.5) * 0.5;
            const distance = Math.random() * 300 + 200;
            
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.background = `radial-gradient(circle, ${color}, rgba(255,255,255,0.5))`;
            particle.style.position = 'fixed';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.boxShadow = `0 0 30px ${color}, 0 0 60px ${color}, 0 0 90px ${color}`;
            particle.style.zIndex = '999';
            
            // Add explosion movement
            particle.style.setProperty('--final-x', Math.cos(angle) * distance + 'px');
            particle.style.setProperty('--final-y', Math.sin(angle) * distance + 'px');
            
            document.body.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 3000);
        }
    }
    
    // Helper method to trigger move particles from other modules
    triggerMoveEffect(row, col) {
        this.createMoveParticles(row, col);
    }
    
    // Helper method to trigger capture particles from other modules
    triggerCaptureEffect(row, col) {
        this.createCaptureParticles(row, col);
    }
    
    // Helper method to trigger checkmate explosion from other modules
    triggerCheckmateExplosion() {
        this.createCheckmateExplosion();
    }
    
    // Clean up any remaining particles (useful for new game)
    clearAllParticles() {
        // Remove any lingering particle effects
        const particles = document.querySelectorAll('.move-particle, .capture-particle, .checkmate-particle');
        particles.forEach(particle => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleEffects;
}