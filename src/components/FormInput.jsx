// src/components/FormInput.jsx
import React from 'react';

/**
 * Reusable Form Input component.
 * Handles label, input, and displays error messages.
 *
 * @param {object} props - Component props.
 * @param {string} props.id - Unique ID for the input and label.
 * @param {string} props.label - Text for the label.
 * @param {string} [props.type='text'] - Input type (e.g., 'text', 'number', 'date', 'email', 'password').
 * @param {any} props.value - Current value of the input.
 * @param {function} props.onChange - Handler for input value changes.
 * @param {string} [props.error] - Error message to display below the input.
 * @param {object} [props.children] - Optional children to render inside (e.g., for select options).
 * @param {string} [props.className] - Additional classes for the input element.
 * @param {object} [props.labelClassName] - Additional classes for the label element.
 * @param {object} [props.wrapperClassName] - Additional classes for the div wrapping label and input.
 * @param {object} [props.inputRef] - Ref to be assigned to the input element.
 * @param {boolean} [props.readOnly] - If true, makes the input read-only.
 * @param {any} [...props] - Any other standard HTML input attributes.
 */
export default function FormInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  children, // For select elements
  className = '',
  labelClassName = '',
  wrapperClassName = '',
  inputRef, // For passing a ref to the input element
  readOnly = false, // Added readOnly prop
  ...props
}) {
  const inputClasses = `mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
    error ? 'border-red-500' : 'border-gray-300'
  } ${className}`;

  return (
    <div className={wrapperClassName}>
      <label htmlFor={id} className={`block text-sm font-medium text-gray-700 ${labelClassName}`}>
        {label}
      </label>
      {type === 'select' ? (
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={`${inputClasses} bg-white`} // Add bg-white for select consistency
          ref={inputRef}
          disabled={readOnly} // Apply readOnly as disabled for select
          {...props}
        >
          {children}
        </select>
      ) : (
        <input
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          className={inputClasses}
          ref={inputRef}
          readOnly={readOnly} // Apply readOnly for input
          {...props}
        />
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
