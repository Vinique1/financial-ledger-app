// src/components/ActionButton.jsx
import React from 'react';

/**
 * Reusable Action Button component with loading state.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The content for the button.
 * @param {function} props.onClick - Click event handler.
 * @param {'blue' | 'red' | 'gray' | 'green'} [props.color='blue'] - Color scheme.
 * @param {boolean} [props.loading=false] - If true, shows a spinner and disables the button.
 * @param {string} [props.className=''] - Additional CSS classes.
 * @param {any} [...props] - Any other standard HTML button attributes (e.g., type, disabled).
 */
export default function ActionButton({ children, onClick, color = 'blue', loading = false, className = '', disabled, ...props }) {
  const baseClasses = 'px-4 py-2 font-medium rounded-md transition-colors duration-200 flex items-center justify-center';
  
  const colorClasses = {
    blue: 'bg-blue-600 text-white hover:bg-blue-700',
    red: 'bg-red-600 text-white hover:bg-red-700',
    gray: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    green: 'bg-green-600 text-white hover:bg-green-700',
  };

  const disabledClasses = 'disabled:bg-gray-400 disabled:cursor-not-allowed';

  const combinedClasses = `${baseClasses} ${colorClasses[color]} ${disabledClasses} ${className}`;

  return (
    <button onClick={onClick} className={combinedClasses} disabled={disabled || loading} {...props}>
      {loading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        children
      )}
    </button>
  );
}
