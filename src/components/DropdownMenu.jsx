// src/components/DropdownMenu.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';

export default function DropdownMenu({ children }) {
  const [isOpen, setIsOpen] = useState(false); // State to control dropdown visibility
  const menuRef = useRef(null); // Ref for the dropdown menu div
  const buttonRef = useRef(null); // Ref for the ellipsis button
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 }); // State for dropdown position

  // Effect to handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Effect to calculate and set the dropdown's position when it opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 192; // Corresponds to w-48 in Tailwind CSS

      setPosition({
        top: rect.bottom + window.scrollY, // Position below the button, accounting for scroll
        left: Math.max(0, rect.right - menuWidth + window.scrollX), // Align right edge, prevent going off-screen left
        width: rect.width, // Optional: if you want the menu to match button width
      });
    }
  }, [isOpen, buttonRef]);

  // Use useMemo to create the portal root element only once
  const portalRoot = useMemo(() => {
    let element = document.getElementById('dropdown-root');
    if (!element) {
      element = document.createElement('div');
      element.setAttribute('id', 'dropdown-root');
      document.body.appendChild(element);
    }
    return element;
  }, []);

  return (
    <div className="relative inline-block text-left">
      <div>
        {/* Ellipsis button to toggle the dropdown */}
        <button
          ref={buttonRef} // Assign ref to the button
          type="button"
          onClick={() => setIsOpen(!isOpen)} // Toggle isOpen state on click
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-2 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          id="options-menu" // Unique ID for accessibility
          aria-haspopup="true" // Indicates a popup will be displayed
          aria-expanded={isOpen} // Indicates whether the popup is currently expanded
          aria-label="More options" // Accessibility label for screen readers
        >
          {/* Ellipsis SVG icon - now perfectly aligned vertical dots */}
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Dropdown menu content, rendered via Portal */}
      {isOpen && ReactDOM.createPortal(
        <div
          ref={menuRef} // Assign ref to the menu div
          className="absolute rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50" // Increased z-index
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            // If you want the menu width to match the button, uncomment the next line:
            // width: `${position.width}px`
            width: '192px' // Explicitly set width to w-48 (192px)
          }}
          role="menu" // ARIA role for a menu
          aria-orientation="vertical" // ARIA orientation for a vertical menu
          aria-labelledby="options-menu" // Links to the button that controls it
        >
          <div className="py-1" role="none">
            {/* Iterate over children (the action buttons passed to DropdownMenu) */}
            {React.Children.map(children, (child) =>
                React.cloneElement(child, {
                    // Close the menu when an item is clicked
                    onClick: (...args) => {
                        setIsOpen(false);
                        // Call the original onClick if it exists
                        if (child.props.onClick) {
                            child.props.onClick(...args);
                        }
                    },
                    // Apply common styling for menu items
                    className: `block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${child.props.className || ''}`
                })
            )}
          </div>
        </div>,
        portalRoot
      )}
    </div>
  );
}
