// src/hooks/useForm.js
import { useState, useRef, useEffect, useCallback } from 'react';

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

  // Use refs to hold the initial state and validate function.
  // This ensures that our callbacks don't change if the parent component
  // accidentally re-creates these on every render.
  const initialStateRef = useRef(initialState);
  const validateRef = useRef(validate);

  // We also want to update the validate function if it changes
  useEffect(() => {
    validateRef.current = validate;
  }, [validate]);

  // This function is now stable and won't be recreated on every render.
  const handleChange = useCallback((e) => {
    const { id, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [id]: newValue }));

    // Clear the error for the field being edited as the user types.
    setErrors((prevErrors) => {
      // If the specific error doesn't exist, don't update the state.
      if (!prevErrors[id]) return prevErrors;
      
      const newErrors = { ...prevErrors };
      delete newErrors[id]; // Remove the error key
      return newErrors;
    });
  }, []); // Empty dependency array means this function is created only once.

  // This function now only depends on `formData`, which is what we want.
  const handleSubmit = useCallback((callback) => async (e) => {
    e.preventDefault();

    let validationErrors = {};
    if (validateRef.current) {
      validationErrors = validateRef.current(formData);
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    await callback(formData);
  }, [formData]);

  // This function is now stable and won't be recreated on every render.
  const resetForm = useCallback(() => {
    setFormData(initialStateRef.current);
    setErrors({});
  }, []); // Empty dependency array ensures stability.

  return { formData, setFormData, errors, handleChange, handleSubmit, resetForm };
}
