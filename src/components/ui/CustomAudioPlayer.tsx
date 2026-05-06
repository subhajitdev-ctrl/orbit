import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface CustomAudioPlayerProps {
  url: string;
  className?: string;
  autoPlay?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export const CustomAudioPlayer = ({ 
  url, 
  className,
  autoPlay = true,
  onPlay,
  onPause,
  onEnded
}: CustomAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (autoPlay && url) {
      audio.play().then(() => {
        setIsPlaying(true);
        onPlay?.();
      }).catch(err => {
        console.warn("Autoplay blocked or failed:", err);
        setIsPlaying(false);
      });
    }

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onEnded]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        onPause?.();
      } else {
        audioRef.current.play();
        onPlay?.();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("flex flex-col gap-2 w-full bg-zinc-50/50 p-3 rounded-2xl border border-zinc-100", className)}>
      <audio ref={audioRef} src={url} />
      
      <div className="flex items-center gap-3">
        <button 
          onClick={togglePlay}
          className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <input 
            type="range" 
            min="0" 
            max={duration || 0} 
            value={currentTime} 
            onChange={handleProgressChange}
            className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <button onClick={toggleMute} className="text-zinc-400 hover:text-primary transition-colors">
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Visualizer Mockup */}
      <div className="flex items-end gap-0.5 h-4 px-1">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              height: isPlaying ? [4, Math.random() * 12 + 4, 4] : 4 
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 0.5 + Math.random() * 0.5,
              ease: "easeInOut"
            }}
            className={cn(
              "w-full rounded-full transition-colors",
              isPlaying ? "bg-primary/40" : "bg-zinc-200"
            )}
          />
        ))}
      </div>
    </div>
  );
};
