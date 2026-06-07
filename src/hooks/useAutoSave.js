import { useEffect, useRef } from 'react';

export const useAutoSave = (callback, delay = 2000) => {
  const timer = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const trigger = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      callbackRef.current();
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return trigger;
};