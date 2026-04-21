import { useRef } from 'react';

export default function OtpInput({ value, onChange }) {
  const inputRefs = useRef([]);

  const handleChange = (index, e) => {
    const val = e.target.value;
    if (!/^[0-9]?$/.test(val)) return;

    const newOtp = [...value];
    newOtp[index] = val;
    onChange(newOtp);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    const newOtp = [...value];
    pasted.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    onChange(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="otp-container" onPaste={handlePaste}>
      {value.map((digit, index) => (
        <input
          key={index}
          ref={el => inputRefs.current[index] = el}
          className={`otp-input ${digit ? 'filled' : ''}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(index, e)}
          onKeyDown={e => handleKeyDown(index, e)}
        />
      ))}
    </div>
  );
}