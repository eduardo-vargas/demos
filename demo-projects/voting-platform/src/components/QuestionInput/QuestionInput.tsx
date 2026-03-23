import { useState } from 'react';
import { Text, TextField, Button } from '@react-spectrum/s2';
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };

interface QuestionInputProps {
  search: string;
  onSearchChange: (value: string) => void;
  meetingStatus: 'Active' | 'Closed';
  onSubmit: (question: string) => Promise<void>;
  submitting: boolean;
}

export function QuestionInput({
  search,
  onSearchChange,
  meetingStatus,
  onSubmit,
  submitting,
}: QuestionInputProps) {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onSearchChange(newValue);
  };

  const canPost = value.trim() && meetingStatus === 'Active';

  const handleSubmit = async () => {
    if (!canPost || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(value.trim());
      setValue('');
      onSearchChange('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={style({
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginBottom: 16,
      })}
    >
      <div
        className={style({
          flexGrow: 1,
          borderRadius: 'lg',
          overflow: 'hidden',
          marginBottom: 8,
        })}
        style={{
          boxShadow: meetingStatus === 'Active' ? '0 0px 10px 0 var(--lavaLampFill)' : 'none',
        }}
      >
        <TextField
          aria-label="Ask or search questions"
          value={value}
          onChange={handleValueChange}
          placeholder={search ? 'Searching...' : 'Ask or search questions...'}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      <Button
        variant="accent"
        UNSAFE_style={{ width: '100%' }}
        onPress={handleSubmit}
        isDisabled={!canPost || isSubmitting || submitting}
      >
        <Text>{isSubmitting || submitting ? 'Posting...' : 'Post your question'}</Text>
      </Button>
    </div>
  );
}
