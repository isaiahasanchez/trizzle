import React, { useState, useEffect } from 'react';
import './Timer.css';

const Timer = () => {
  // The original defaults remain 1:30 and are used after page refresh
  const [originalDefaultMinutes] = useState(1);
  const [originalDefaultSeconds] = useState(30);

  // The current "temporary" default, which updates on any edits
  const [defaultMinutes, setDefaultMinutes] = useState(originalDefaultMinutes);
  const [defaultSeconds, setDefaultSeconds] = useState(originalDefaultSeconds);

  // Actual countdown time
  const [minutes, setMinutes] = useState(originalDefaultMinutes);
  const [seconds, setSeconds] = useState(originalDefaultSeconds);

  const [isRunning, setIsRunning] = useState(false);
  const [flashRed, setFlashRed] = useState(false);

  // Toggles whether we show increment/decrement controls
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let timerInterval;
    if (isRunning) {
      timerInterval = setInterval(() => {
        setSeconds((prevSec) => {
          if (prevSec > 0) {
            return prevSec - 1;
          } else {
            // seconds = 0, check minutes
            if (minutes > 0) {
              setMinutes((m) => m - 1);
              return 59;
            } else {
              // time fully out
              setFlashRed(true);
              return 0;
            }
          }
        });
      }, 1000);
    }

    return () => clearInterval(timerInterval);
  }, [isRunning, minutes]);

  // Format as mm:ss
  const formatTime = () => {
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // Whenever user changes minutes, we also update the default
  const incrementMinutes = (val) => {
    if (flashRed) setFlashRed(false);

    // new actual minutes
    const newM = Math.max(0, minutes + val);

    setMinutes(newM);
    // Also store as new default
    setDefaultMinutes(newM);
    setDefaultSeconds(seconds);
  };

  // Whenever user changes seconds by +/-15, also update the default
  const incrementSeconds = (val) => {
    if (flashRed) setFlashRed(false);

    const totalSeconds = minutes * 60 + seconds + val;
    if (totalSeconds <= 0) {
      // clamp to 0
      setMinutes(0);
      setSeconds(0);
      setDefaultMinutes(0);
      setDefaultSeconds(0);
      return;
    }

    const newM = Math.floor(totalSeconds / 60);
    const newS = totalSeconds % 60;

    setMinutes(newM);
    setSeconds(newS);
    // Update default
    setDefaultMinutes(newM);
    setDefaultSeconds(newS);
  };

  // Reset to whatever the *current* default is (not the original 1:30)
  const handleReset = () => {
    setIsRunning(false);
    setFlashRed(false);
    setMinutes(defaultMinutes);
    setSeconds(defaultSeconds);
  };

  const handleStartPause = () => {
    if (flashRed) setFlashRed(false);
    setIsRunning(!isRunning);
  };

  // Toggles editing UI, no longer updates default here
  const toggleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  return (
    <div className="timerContainer">


      <div className="timerControls">
        {/* Pencil icon to toggle editing */}
        <button onClick={toggleEdit}>
          {isEditing ? 'Hide' : '✎'}
        </button>

        {/* Conditionally render time-edit buttons if editing */}
        {isEditing && (
          <div className="timeAdjustButtons">
            <button onClick={() => incrementMinutes(1)}>+1 min</button>
            <button onClick={() => incrementMinutes(-1)}>-1 min</button>
            <button onClick={() => incrementSeconds(15)}>+15s</button>
            <button onClick={() => incrementSeconds(-15)}>-15s</button>
          </div>
        )}

        {/* Always visible: Start/Pause and Reset */}
        <button onClick={handleStartPause}>
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button onClick={handleReset}>Reset</button>

        <div className={`timerDisplay ${flashRed ? 'flashRed' : ''}`}>
        {formatTime()}
      </div>
      </div>
    </div>
  );
};

export default Timer;
