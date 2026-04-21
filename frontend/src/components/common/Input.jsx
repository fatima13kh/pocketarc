// src/components/common/Input.jsx
import { useState } from 'react';
import { FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';

export default function Input({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
  autoComplete,
  required = false,
  showClear = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const handleClear = () => {
    onChange({ target: { name, value: '' } });
  };

  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={name}>
          {label}
          {required && <span className="required-star">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={`form-input ${error ? 'error' : ''}`}
        />
        {value && showClear && (
          <button type="button" className="input-clear-btn" onClick={handleClear}>
            <FaTimes />
          </button>
        )}
        {isPassword && (
          <button
            type="button"
            className="input-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}
      {hint && !error && <span className="form-hint">{hint}</span>}
    </div>
  );
}