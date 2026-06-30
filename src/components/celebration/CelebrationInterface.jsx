import React, { useState, useEffect, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import './CelebrationInterface.css'

const CelebrationInterface = ({ 
  isOpen, 
  onClose, 
  leaderboard = [], 
  leagueName = "الدوري",
  autoPlay = false 
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAutoPlay, setIsAutoPlay] = useState(autoPlay)
  const [celebrationConfig, setCelebrationConfig] = useState({
    intensity: 'medium', // low, medium, high
    duration: 8000, // milliseconds
    colors: ['#FFDDC1', '#FFD6E0', '#C8F7C5', '#CDE7FF', '#FFE5B4', '#E6E6FA'],
    enableSound: true,
    enableConfetti: true
  })
  
  const canvasRef = useRef(null)
  const audioRef = useRef(null)
  const celebrationTimeoutRef = useRef(null)
  const autoPlayTimeoutRef = useRef(null)
  const continuousConfettiRef = useRef(null)

  // Sound effect
  const playCelebrationSound = useCallback(() => {
    if (!celebrationConfig.enableSound) return
    
    try {
      // Create a simple celebration sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Create a sequence of celebratory tones
      const frequencies = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
      
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0, audioContext.currentTime)
          gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.5)
        }, index * 200)
      })
    } catch (error) {
      console.log('Audio not supported:', error)
    }
  }, [celebrationConfig.enableSound])

  // Continuous confetti effect
  const startContinuousConfetti = useCallback(() => {
    if (!celebrationConfig.enableConfetti || !canvasRef.current) return

    const createConfettiBurst = () => {
      if (!canvasRef.current) return
      
      const colors = celebrationConfig.colors
      
      // Create multiple bursts from different positions for better visibility
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const randomX = Math.random()
          const randomY = Math.random() * 0.3 + 0.05 // Start from top area
          
          confetti({
            particleCount: 12,
            spread: 60,
            origin: { x: randomX, y: randomY },
            startVelocity: 25,
            gravity: 0.3,
            ticks: 200,
            scalar: 0.8,
            colors,
            shapes: ['square', 'circle', 'star'],
            drift: 0.1
          })
        }, i * 200)
      }
    }

    // Create initial burst
    createConfettiBurst()
    
    // Continue creating bursts every 1-2 seconds for more frequent effect
    const interval = setInterval(() => {
      createConfettiBurst()
    }, Math.random() * 1000 + 1000) // Random interval between 1-2 seconds

    return interval
  }, [celebrationConfig])

  // Stop continuous confetti
  const stopContinuousConfetti = useCallback((interval) => {
    if (interval) {
      clearInterval(interval)
    }
  }, [])

  // Confetti effect
  const triggerConfetti = useCallback(() => {
    if (!celebrationConfig.enableConfetti || !canvasRef.current) return

    const intensity = celebrationConfig.intensity
    const colors = celebrationConfig.colors
    
    let particleCount, spread, startVelocity, gravity, ticks, scalar
    
    switch (intensity) {
      case 'low':
        particleCount = 50
        spread = 45
        startVelocity = 30
        gravity = 0.8
        ticks = 200
        scalar = 0.8
        break
      case 'high':
        particleCount = 200
        spread = 70
        startVelocity = 45
        gravity = 1.2
        ticks = 300
        scalar = 1.2
        break
      default: // medium
        particleCount = 100
        spread = 60
        startVelocity = 35
        gravity = 1.0
        ticks = 250
        scalar = 1.0
    }

    // Multiple bursts for more celebration
    const bursts = [
      { x: 0.1, y: 0.1 },
      { x: 0.5, y: 0.1 },
      { x: 0.9, y: 0.1 },
      { x: 0.2, y: 0.3 },
      { x: 0.8, y: 0.3 }
    ]

    bursts.forEach((burst, index) => {
      setTimeout(() => {
        confetti({
          particleCount,
          spread,
          origin: burst,
          startVelocity,
          gravity,
          ticks,
          scalar,
          colors,
          shapes: ['square', 'circle'],
          drift: 0.5
        })
      }, index * 200)
    })

    // Additional falling confetti
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 100,
        origin: { x: 0.5, y: 0 },
        startVelocity: 20,
        gravity: 0.8,
        ticks: 400,
        scalar: 0.8,
        colors,
        shapes: ['star', 'square']
      })
    }, 1000)
  }, [celebrationConfig])

  // Start celebration
  const startCelebration = useCallback(() => {
    if (isPlaying) return
    
    setIsPlaying(true)
    playCelebrationSound()
    triggerConfetti()
    
    // Stop celebration after duration
    celebrationTimeoutRef.current = setTimeout(() => {
      setIsPlaying(false)
    }, celebrationConfig.duration)
  }, [isPlaying, playCelebrationSound, triggerConfetti, celebrationConfig.duration])

  // Stop celebration
  const stopCelebration = useCallback(() => {
    setIsPlaying(false)
    if (celebrationTimeoutRef.current) {
      clearTimeout(celebrationTimeoutRef.current)
    }
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current)
    }
  }, [])

  // Start continuous confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      // Start continuous confetti only when modal is open
      continuousConfettiRef.current = startContinuousConfetti()
      
      // Auto play celebration if enabled
      if (isAutoPlay && !isPlaying) {
        autoPlayTimeoutRef.current = setTimeout(() => {
          startCelebration()
        }, 1000)
      }
    } else {
      // Stop continuous confetti when modal closes
      if (continuousConfettiRef.current) {
        stopContinuousConfetti(continuousConfettiRef.current)
        continuousConfettiRef.current = null
      }
    }
  }, [isOpen, isAutoPlay, isPlaying, startCelebration, startContinuousConfetti, stopContinuousConfetti])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current)
      }
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current)
      }
      if (continuousConfettiRef.current) {
        stopContinuousConfetti(continuousConfettiRef.current)
      }
    }
  }, [stopContinuousConfetti])

  if (!isOpen) return null

  return (
    <div className="celebration-overlay">
      <div className="celebration-background">
        <div className="paper-texture"></div>
        <div className="color-overlay"></div>
        {/* Confetti Canvas - Only inside modal */}
        <div className="confetti-canvas" ref={canvasRef}></div>
      </div>
      
      <div className="celebration-content">
        {/* Header */}
        <div className="celebration-header">
          <div className="celebration-title">
            <h1 className="celebration-league-name">{leagueName}</h1>
            <div className="celebration-subtitle">لوحة المتصدرين</div>
          </div>
          
          <button 
            className="celebration-close-btn"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="celebration-controls">
          <button 
            className={`celebration-btn celebration-trigger ${isPlaying ? 'playing' : ''}`}
            onClick={startCelebration}
            disabled={isPlaying}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <path d="M3 6h18"/>
              <path d="M16 10a4 4 0 11-8 0"/>
            </svg>
            {isPlaying ? 'جاري الاحتفال...' : 'تتويج'}
          </button>
          
          <button 
            className="celebration-btn celebration-reset"
            onClick={stopCelebration}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
            إعادة
          </button>
          
          <label className="celebration-toggle">
            <input 
              type="checkbox" 
              checked={isAutoPlay}
              onChange={(e) => setIsAutoPlay(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            Auto-Play
          </label>
        </div>

        {/* Leaderboard */}
        <div className="celebration-leaderboard">
          {leaderboard.map((student, index) => (
            <div 
              key={`${student.rank}-${student.student_id}`} 
              className={`celebration-student-card ${index < 3 ? `rank-${index + 1}` : ''}`}
            >
              <div className="student-rank">
                {index < 3 ? (
                  <div className="rank-medal">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                  </div>
                ) : (
                  <span className="rank-number">#{student.rank}</span>
                )}
              </div>
              
              <div className="student-info">
                <h3 className="student-name">{student.student_name}</h3>
                <div className="student-stats">
                  <span className="student-score">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    {student.total_score} نقطة
                  </span>
                  <span className="student-attempts">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2h-4"/>
                      <path d="M9 11V9a2 2 0 012-2h2a2 2 0 012 2v2"/>
                      <path d="M9 11h6"/>
                    </svg>
                    {student.submissions_count} محاولة
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default CelebrationInterface
