// Audio Manager - Music control and sound effects
// Self-contained audio events and controls with enhanced error handling and smooth fade effects

class AudioManager {
    constructor() {
        this.musicPlaying = false;
        this.chessMusic = null;
        this.musicToggle = null;
        this.volumeSlider = null;
        this.isReady = false;
        this.fadeTransitionActive = false; // Prevent multiple fade operations
        
        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }
    
    initialize() {
        console.log('AudioManager: Initializing...');
        
        // Get DOM elements
        this.chessMusic = document.getElementById('chessMusic');
        this.musicToggle = document.getElementById('musicToggle');
        this.volumeSlider = document.getElementById('volumeSlider');
        
        // Debug: Check if elements exist
        console.log('AudioManager: Audio element found:', !!this.chessMusic);
        console.log('AudioManager: Toggle button found:', !!this.musicToggle);
        console.log('AudioManager: Volume slider found:', !!this.volumeSlider);
        
        if (!this.chessMusic) {
            console.error('AudioManager: Audio element with id "chessMusic" not found');
            return;
        }
        
        if (!this.musicToggle) {
            console.error('AudioManager: Music toggle button with id "musicToggle" not found');
            return;
        }
        
        if (!this.volumeSlider) {
            console.error('AudioManager: Volume slider with id "volumeSlider" not found');
            return;
        }
        
        this.initializeControls();
        this.setInitialVolume();
        this.setupAudioEventListeners();
        
        console.log('AudioManager: Initialization complete');
    }
    
    initializeControls() {
        // Set up music toggle button
        if (this.musicToggle) {
            // Remove any existing listeners
            this.musicToggle.replaceWith(this.musicToggle.cloneNode(true));
            this.musicToggle = document.getElementById('musicToggle');
            
            this.musicToggle.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('AudioManager: Toggle button clicked');
                this.toggleMusic();
            });
            
            console.log('AudioManager: Music toggle listener attached');
        }
        
        // Set up volume slider
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('input', (e) => {
                console.log('AudioManager: Volume changed to:', e.target.value);
                this.setVolume(e.target.value);
            });
            
            this.volumeSlider.addEventListener('change', (e) => {
                this.setVolume(e.target.value);
            });
            
            console.log('AudioManager: Volume slider listeners attached');
        }
    }
    
    setupAudioEventListeners() {
        if (!this.chessMusic) return;
        
        // Audio loading events
        this.chessMusic.addEventListener('loadstart', () => {
            console.log('AudioManager: Started loading audio');
        });
        
        this.chessMusic.addEventListener('canplay', () => {
            console.log('AudioManager: Audio can start playing');
            this.isReady = true;
        });
        
        this.chessMusic.addEventListener('canplaythrough', () => {
            console.log('AudioManager: Audio can play through without buffering');
        });
        
        this.chessMusic.addEventListener('loadeddata', () => {
            console.log('AudioManager: Audio data loaded');
        });
        
        this.chessMusic.addEventListener('loadedmetadata', () => {
            console.log('AudioManager: Audio metadata loaded, duration:', this.chessMusic.duration);
        });
        
        // Playback events
        this.chessMusic.addEventListener('play', () => {
            console.log('AudioManager: Audio started playing');
            this.musicPlaying = true;
            this.updateMusicButton('🎵 Pause Music', true);
        });
        
        this.chessMusic.addEventListener('pause', () => {
            console.log('AudioManager: Audio paused');
            this.musicPlaying = false;
            this.updateMusicButton('🎵 Play Echoes of the Board', false);
        });
        
        this.chessMusic.addEventListener('ended', () => {
            console.log('AudioManager: Audio ended');
            this.onMusicEnded();
        });
        
        // Error events
        this.chessMusic.addEventListener('error', (e) => {
            console.error('AudioManager: Audio error:', e);
            console.error('AudioManager: Error details:', {
                code: this.chessMusic.error?.code,
                message: this.chessMusic.error?.message,
                networkState: this.chessMusic.networkState,
                readyState: this.chessMusic.readyState
            });
            this.onMusicError();
        });
        
        this.chessMusic.addEventListener('stalled', () => {
            console.warn('AudioManager: Audio loading stalled');
        });
        
        this.chessMusic.addEventListener('suspend', () => {
            console.log('AudioManager: Audio loading suspended');
        });
        
        this.chessMusic.addEventListener('abort', () => {
            console.warn('AudioManager: Audio loading aborted');
        });
        
        // Check if audio source exists
        console.log('AudioManager: Audio source:', this.chessMusic.src || this.chessMusic.currentSrc);
        console.log('AudioManager: Audio ready state:', this.chessMusic.readyState);
        console.log('AudioManager: Audio network state:', this.chessMusic.networkState);
        
        // Try to preload
        this.chessMusic.load();
    }
    
    setInitialVolume() {
        if (this.chessMusic) {
            this.chessMusic.volume = 0.3; // 30% volume by default
            console.log('AudioManager: Initial volume set to 30%');
        }
        if (this.volumeSlider) {
            this.volumeSlider.value = 30;
        }
    }
    
    // Enhanced toggleMusic with smooth fade effects
    toggleMusic() {
        console.log('AudioManager: Toggle music called, current state:', this.musicPlaying);
        
        if (!this.chessMusic) {
            console.error('AudioManager: No audio element available');
            return;
        }
        
        // Prevent multiple concurrent fade operations
        if (this.fadeTransitionActive) {
            console.log('AudioManager: Fade transition already active, ignoring toggle');
            return;
        }
        
        if (this.musicPlaying) {
            console.log('AudioManager: Starting fade out...');
            this.fadeOut(2000); // Smooth 2 second fade out
        } else {
            console.log('AudioManager: Starting fade in...');
            this.fadeInAndPlay(2000); // Smooth 2 second fade in
        }
    }
    
    // Enhanced fadeInAndPlay - starts music and fades in
    async fadeInAndPlay(duration = 1000) {
        if (!this.chessMusic || this.fadeTransitionActive) return;
        
        console.log('AudioManager: Beginning fade in and play sequence');
        this.fadeTransitionActive = true;
        
        try {
            // Store the target volume from slider or default
            const targetVolume = this.volumeSlider ? this.volumeSlider.value / 100 : 0.3;
            
            // Set volume to 0 before starting playback
            this.chessMusic.volume = 0;
            
            // Start playing the music
            await this.playMusicDirect();
            
            // Now fade the volume up
            const steps = 20;
            const stepTime = duration / steps;
            const volumeStep = targetVolume / steps;
            let currentStep = 0;
            
            const fadeInterval = setInterval(() => {
                currentStep++;
                this.chessMusic.volume = Math.min(targetVolume, currentStep * volumeStep);
                
                if (currentStep >= steps) {
                    clearInterval(fadeInterval);
                    this.chessMusic.volume = targetVolume; // Ensure exact target volume
                    this.fadeTransitionActive = false;
                    console.log('AudioManager: Fade in complete');
                }
            }, stepTime);
            
        } catch (error) {
            console.error('AudioManager: Error during fade in:', error);
            this.fadeTransitionActive = false;
            
            // Fallback: try direct play without fade
            this.playMusicDirect();
        }
    }
    
    // Enhanced fadeOut with transition tracking
    fadeOut(duration = 1000) {
        if (!this.chessMusic || this.fadeTransitionActive) return;
        
        console.log('AudioManager: Beginning fade out sequence');
        this.fadeTransitionActive = true;
        
        const startVolume = this.chessMusic.volume;
        const steps = 20;
        const stepTime = duration / steps;
        const volumeStep = startVolume / steps;
        let currentStep = 0;
        
        const fadeInterval = setInterval(() => {
            currentStep++;
            this.chessMusic.volume = Math.max(0, startVolume - (currentStep * volumeStep));
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                this.chessMusic.volume = 0; // Ensure volume is exactly 0
                this.pauseMusic(); // Pause after fade completes
                this.fadeTransitionActive = false;
                console.log('AudioManager: Fade out complete');
            }
        }, stepTime);
    }
    
    // Direct play method for internal use (no fade)
    async playMusicDirect() {
        if (!this.chessMusic) {
            console.error('AudioManager: No audio element for playback');
            return;
        }
        
        console.log('AudioManager: Attempting to play music directly...');
        console.log('AudioManager: Ready state:', this.chessMusic.readyState);
        console.log('AudioManager: Network state:', this.chessMusic.networkState);
        
        try {
            // Check if we can play
            if (this.chessMusic.readyState < 2) { // HAVE_CURRENT_DATA
                console.log('AudioManager: Audio not ready, waiting...');
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Audio loading timeout'));
                    }, 5000);
                    
                    const onCanPlay = () => {
                        clearTimeout(timeout);
                        this.chessMusic.removeEventListener('canplay', onCanPlay);
                        this.chessMusic.removeEventListener('error', onError);
                        resolve();
                    };
                    
                    const onError = (e) => {
                        clearTimeout(timeout);
                        this.chessMusic.removeEventListener('canplay', onCanPlay);
                        this.chessMusic.removeEventListener('error', onError);
                        reject(e);
                    };
                    
                    this.chessMusic.addEventListener('canplay', onCanPlay);
                    this.chessMusic.addEventListener('error', onError);
                });
            }
            
            const playPromise = this.chessMusic.play();
            
            if (playPromise !== undefined) {
                await playPromise;
                console.log('AudioManager: Music started successfully');
            }
            
        } catch (error) {
            console.error('AudioManager: Failed to play music:', error);
            
            // Handle specific error types
            if (error.name === 'NotAllowedError') {
                this.updateMusicButton('🎵 Click to Play (Browser Blocked)', false);
                console.log('AudioManager: Autoplay blocked by browser - user interaction required');
            } else if (error.name === 'NotSupportedError') {
                this.updateMusicButton('🎵 Format Not Supported', false);
                console.error('AudioManager: Audio format not supported');
            } else {
                this.updateMusicButton('🎵 Music Unavailable', false);
                console.error('AudioManager: Unknown playback error:', error);
            }
            
            throw error; // Re-throw for fadeInAndPlay error handling
        }
    }
    
    // Keep existing playMusic method for backward compatibility
    async playMusic() {
        // For backward compatibility, call direct play
        // But new code should use fadeInAndPlay for smooth experience
        return this.playMusicDirect();
    }
    
    pauseMusic() {
        if (!this.chessMusic) return;
        
        console.log('AudioManager: Pausing music');
        this.chessMusic.pause();
        // Note: The 'pause' event listener will update the button state
    }
    
    updateMusicButton(text, isPlaying) {
        if (!this.musicToggle) return;
        
        console.log('AudioManager: Updating button:', text, 'Playing:', isPlaying);
        this.musicToggle.textContent = text;
        
        if (isPlaying) {
            this.musicToggle.classList.add('playing');
        } else {
            this.musicToggle.classList.remove('playing');
        }
    }
    
    setVolume(value) {
        if (!this.chessMusic) return;
        
        const volume = Math.max(0, Math.min(100, parseInt(value))) / 100;
        this.chessMusic.volume = volume;
        console.log('AudioManager: Volume set to:', volume);
        
        // Update slider if called programmatically
        if (this.volumeSlider && this.volumeSlider.value != value) {
            this.volumeSlider.value = value;
        }
    }
    
    getVolume() {
        return this.chessMusic ? this.chessMusic.volume * 100 : 0;
    }
    
    onMusicEnded() {
        console.log('AudioManager: Music ended naturally');
        // Music loop is handled by HTML loop attribute
        // This is here for future sound effect handling
    }
    
    onMusicError() {
        console.error('AudioManager: Music error occurred');
        this.musicPlaying = false;
        this.fadeTransitionActive = false; // Reset transition state on error
        this.updateMusicButton('🎵 Music Unavailable', false);
    }
    
    // Keep existing fadeIn for any external usage
    fadeIn(duration = 1000) {
        // Redirect to the new enhanced method
        this.fadeInAndPlay(duration);
    }
    
    // Future: Sound effects for moves, captures, etc.
    playMoveSound() {
        // Placeholder for move sound effect
    }
    
    playCaptureSound() {
        // Placeholder for capture sound effect
    }
    
    playCheckSound() {
        // Placeholder for check sound effect
    }
    
    playCheckmateSound() {
        // Placeholder for checkmate sound effect
    }
    
    // Mute/unmute all audio
    mute() {
        if (this.chessMusic) {
            this.chessMusic.muted = true;
        }
    }
    
    unmute() {
        if (this.chessMusic) {
            this.chessMusic.muted = false;
        }
    }
    
    // Get current audio state
    getState() {
        return {
            playing: this.musicPlaying,
            volume: this.getVolume(),
            muted: this.chessMusic ? this.chessMusic.muted : false,
            ready: this.isReady,
            fading: this.fadeTransitionActive
        };
    }
    
    // Reset audio for new game (if needed)
    reset() {
        // Reset fade state but preserve volume and playing state
        this.fadeTransitionActive = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}