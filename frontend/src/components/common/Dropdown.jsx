// src/components/common/Dropdown.jsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Dropdown({ trigger, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dropdown" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="dropdown-trigger">
        {trigger}
      </div>
      {isOpen && <div className="dropdown-menu">{children}</div>}
    </div>
  );
}