// src/components/SearchableSelect.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useDetectOutsideClick } from '../hooks/useDetectOutsideClick';

export default function SearchableSelect({ options, value, onChange, placeholder = "Select..." }) {
  const [isOpen, setIsOpen, dropdownRef] = useDetectOutsideClick(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredOptions(options);
    } else {
      setFilteredOptions(
        options.filter(option =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, options]);

  // --- FIX APPLIED HERE ---
  // This function is now called when a user clicks an item.
  // It calls the 'onChange' prop to update the parent form's state,
  // sets the search term to the selected value, and closes the dropdown.
  const handleSelectOption = (optionValue) => {
    onChange(optionValue); // This was the missing call
    setSearchTerm(optionValue);
    setIsOpen(false);
  };

  useEffect(() => {
    // Sync the search term with the external value
    setSearchTerm(value || '');
  }, [value]);

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
      />
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                // The onClick handler now correctly calls our new function
                onClick={() => handleSelectOption(option.value)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-500 hover:text-white cursor-pointer"
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">No options found</div>
          )}
        </div>
      )}
    </div>
  );
}
