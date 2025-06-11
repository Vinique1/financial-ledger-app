// src/components/ActionButton.jsx
import React from 'react';

/**
 * Reusable Action Button component.
 * Provides consistent styling for various button types (primary, danger, secondary).
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The content to display inside the button (e.g., text, icon).
 * @param {function} props.onClick - Click event handler.
 * @param {'blue' | 'red' | 'gray' | 'green'} [props.color='blue'] - Predefined color scheme for the button.
 * @param {string} [props.className=''] - Additional CSS classes to apply.
 * @param {any} [...props] - Any other standard HTML button attributes (e.g., type, disabled).
 */
export default function ActionButton({ children, onClick, color = 'blue', className = '', ...props }) {
  const baseClasses = 'px-4 py-2 font-medium rounded-md transition-colors duration-200';
  const colorClasses = {
    blue: 'bg-blue-600 text-white hover:bg-blue-700',
    red: 'bg-red-600 text-white hover:bg-red-700',
    gray: 'bg-gray-300 text-gray-800 hover:bg-gray-400',
    green: 'bg-green-600 text-white hover:bg-green-700',
  };

  const combinedClasses = `${baseClasses} ${colorClasses[color]} ${className}`;

  return (
    <button onClick={onClick} className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
