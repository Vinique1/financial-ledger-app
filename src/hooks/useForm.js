// src/hooks/useForm.js
import { useState, useRef, useEffect } from 'react';

/**
 * Custom hook for managing form state, changes, validation, and submission.
 *
 * @param {object} initialState - The initial state object for the form data.
 * @param {function} [validate] - Optional validation function that takes formData and returns an errors object.
 * @returns {object} An object containing formData, setFormData, errors, handleChange, handleSubmit, resetForm.
 */
export function useForm(initialState, validate = null) {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const isMounted = useRef(false); // To prevent validation on initial mount

  // Use useEffect to set isMounted to true after the initial render
  useEffect(() => {
    isMounted.current = true;
  }, []);

  const handleChange = (e) => {
    // Handle change for inputs and selects.
    // e.target.id works for inputs/selects.
    // For specific scenarios (e.g., checkbox 'checked' vs 'value'),
    // you might need to extend this or handle them outside the hook.
    const { id, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [id]: newValue }));

    // Clear error for this field as user types, but only after initial mount
    if (isMounted.current && errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: undefined }));
    }
  };

  const handleSubmit = (callback) => async (e) => {
    e.preventDefault();

    let validationErrors = {};
    if (validate) {
      validationErrors = validate(formData);
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // You might want to toast an error here if the form is invalid
      // toast.error('Please correct the form errors.');
      return;
    }

    setErrors({}); // Clear all errors on successful validation
    await callback(formData); // Call the provided submit handler with current formData
  };

  const resetForm = () => {
    setFormData(initialState);
    setErrors({});
  };

  return {
    formData,
    setFormData, // Allows setting data for editing
    errors,
    handleChange,
    handleSubmit,
    resetForm,
  };
}
