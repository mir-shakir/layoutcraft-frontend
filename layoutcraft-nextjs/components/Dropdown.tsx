'use client';

import React, { useState, useEffect, useRef } from 'react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  type: 'dimensions' | 'style';
  options: DropdownOption[];
  isMultiSelect: boolean;
  selectedValues: string[];
  onSelectionChange: (type: 'dimensions' | 'style', value: string, isSelected: boolean) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ type, options, isMultiSelect, selectedValues, onSelectionChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const buttonLabel = isMultiSelect
    ? `Dimensions (${selectedValues.length})`
    : `Style: ${options.find(o => o.value === selectedValues[0])?.label || 'Auto'}`;

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <button className="dropdown-toggle" onClick={toggleDropdown}>
        {buttonLabel}
      </button>
      {isOpen && (
        <div className="dropdown-menu show">
          {options.map(option => (
            <div key={option.value} className="dropdown-item">
              <label>
                <input
                  type={isMultiSelect ? 'checkbox' : 'radio'}
                  name={`${type}-option`}
                  value={option.value}
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => onSelectionChange(type, option.value, e.target.checked)}
                />
                {option.label}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
