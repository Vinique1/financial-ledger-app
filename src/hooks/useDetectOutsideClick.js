// src/hooks/useDetectOutsideClick.js
import { useState, useEffect, useRef } from 'react';

/**
 * A custom hook that detects clicks outside of a specified element.
 * @param {any} initialValue - The initial value for the active state.
 * @returns {[any, Function, React.RefObject<any>]} A tuple containing the active state, a function to set the state, and a ref to attach to the element.
 */
export const useDetectOutsideClick = (initialValue) => {
  const [isActive, setIsActive] = useState(initialValue);
  const ref = useRef(null);

  const handleClickOutside = (e) => {
    // If the click is outside the referenced element, set state to false.
    if (ref.current && !ref.current.contains(e.target)) {
      setIsActive(false);
    }
  };

  useEffect(() => {
    // Add event listener when the component mounts.
    document.addEventListener('mousedown', handleClickOutside);
    // Clean up the event listener when the component unmounts.
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  });

  return [isActive, setIsActive, ref];
};
