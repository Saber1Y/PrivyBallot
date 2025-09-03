"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  deadline: number; // timestamp in ms
  onExpire?: () => void;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function CountdownTimer({
  deadline,
  onExpire,
  className = "",
}: CountdownTimerProps) {
  const hasExpiredRef = useRef(false);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(deadline)
  );

  useEffect(() => {
    // Reset the expired flag when deadline changes
    hasExpiredRef.current = false;

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(deadline);
      setTimeLeft(newTimeLeft);

      // Only call onExpire once when the proposal first expires
      if (newTimeLeft.total <= 0 && !hasExpiredRef.current && onExpire) {
        hasExpiredRef.current = true;
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpire]);

  function calculateTimeLeft(targetTime: number): TimeLeft {
    const difference = targetTime - Date.now();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
    };
  }

  if (timeLeft.total <= 0) {
    return (
      <div className={`flex items-center gap-1 text-red-600 ${className}`}>
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Ended</span>
      </div>
    );
  }

  const formatTime = () => {
    const parts = [];

    if (timeLeft.days > 0) {
      parts.push(`${timeLeft.days}d`);
    }
    if (timeLeft.hours > 0 || timeLeft.days > 0) {
      parts.push(`${timeLeft.hours}h`);
    }
    if (timeLeft.minutes > 0 || timeLeft.hours > 0 || timeLeft.days > 0) {
      parts.push(`${timeLeft.minutes}m`);
    }
    parts.push(`${timeLeft.seconds}s`);

    return parts.join(" ");
  };

  const getColorClass = () => {
    if (timeLeft.total < 5 * 60 * 1000) {
      // Less than 5 minutes
      return "text-red-600";
    } else if (timeLeft.total < 30 * 60 * 1000) {
      // Less than 30 minutes
      return "text-orange-600";
    } else if (timeLeft.total < 60 * 60 * 1000) {
      // Less than 1 hour
      return "text-yellow-600";
    }
    return "text-green-600";
  };

  return (
    <div className={`flex items-center gap-1 ${getColorClass()} ${className}`}>
      <Clock className="h-4 w-4" />
      <span className="text-sm font-medium">{formatTime()} left</span>
    </div>
  );
}
