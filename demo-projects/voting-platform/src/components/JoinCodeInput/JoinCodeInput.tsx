import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };

export interface JoinCodeInputRef {
  focusFirst: () => void;
}

interface JoinCodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  autoSubmit?: boolean;
}

const containerStyle = style({
  display: 'flex',
  justifyContent: 'center',
  marginTop: 16,
  gap: 8,
});

const inputStyles = style({
  width: '15%',
  height: '[3rem]',
  textAlign: 'center',
  fontSize: 'heading',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  border: '0px',
  borderRadius: 'lg',
  outline: 'none',
  transition: 'colors',
  backgroundColor: 'Background',
});

export const JoinCodeInput = forwardRef<JoinCodeInputRef, JoinCodeInputProps>(
  function JoinCodeInput(
    { length = 6, value, onChange, onComplete, autoFocus = true, autoSubmit = false },
    ref
  ) {
    const [digits, setDigits] = useState<string[]>(() =>
      Array(length)
        .fill('')
        .map((_, i) => (value[i] ? value[i].toUpperCase() : ''))
    );
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useImperativeHandle(ref, () => ({
      focusFirst: () => {
        inputRefs.current[0]?.focus();
      },
    }));

    useEffect(() => {
      const newDigits = Array(length)
        .fill('')
        .map((_, i) => (value[i] ? value[i].toUpperCase() : ''));
      setDigits(newDigits);
      if (value === '' && inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, [value, length]);

    useEffect(() => {
      if (autoFocus && inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, [autoFocus]);

    const updateDigits = (newDigits: string[]) => {
      setDigits(newDigits);
      onChange(newDigits.join(''));
      if (autoSubmit && newDigits.join('').length === length && onComplete) {
        onComplete(newDigits.join(''));
      }
    };

    const handleInput = (index: number, inputValue: string) => {
      const char = inputValue
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(-1);
      const newDigits = [...digits];

      if (char && index < length) {
        newDigits[index] = char;
        if (index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }
        updateDigits(newDigits);
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      const newDigits = [...digits];

      if (e.key === 'Backspace') {
        if (digits[index] === '' && index > 0) {
          newDigits[index - 1] = '';
          inputRefs.current[index - 1]?.focus();
          updateDigits(newDigits);
        } else if (digits[index] !== '') {
          newDigits[index] = '';
          updateDigits(newDigits);
        }
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
        e.preventDefault();
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
        e.preventDefault();
      } else if (e.key === 'Enter') {
        const joined = newDigits.join('');
        if (joined.length === length && onComplete) {
          onComplete(joined);
        }
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData
        .getData('text')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      const chars = pastedData.split('').slice(0, length);
      const newDigits = [...digits];

      chars.forEach((char, i) => {
        newDigits[i] = char;
      });

      updateDigits(newDigits);

      const nextEmptyIndex = newDigits.findIndex(d => d === '');
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[length - 1]?.focus();
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
    };

    return (
      <div
        role="group"
        aria-label="Meeting code input"
        data-join-code-input
        className={containerStyle}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={el => {
              inputRefs.current[index] = el;
            }}
            name={`join-code-digit-${index}`}
            id={`join-code-digit-${index}`}
            type="text"
            inputMode="text"
            maxLength={1}
            value={digit}
            onChange={e => handleInput(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={handleFocus}
            className={inputStyles}
            aria-label={`Digit ${index + 1} of ${length}`}
          />
        ))}
        <style>{`
        [data-join-code-input] input {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
        [data-join-code-input] input:focus {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
      </div>
    );
  }
);

export { JoinCodeInput as default };
