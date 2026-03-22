import { ActionButton, Text } from '@react-spectrum/s2';
import ThumbUp from '@react-spectrum/s2/icons/ThumbUp';
import ThumbDown from '@react-spectrum/s2/icons/ThumbDown';
import type { Question } from '../../types';
import { sanitizeEmail } from '../MeetingStatus';
import { useIsMobile } from '../../hooks/useBreakpoint';
import { iconStyle, style } from '@react-spectrum/s2/style' with { type: 'macro' };

interface QuestionCardProps {
  question: Question;
  onVote: (id: number, type: 'up' | 'down') => void;
  isAuthenticated: boolean;
}

export function QuestionCard({ question: q, onVote, isAuthenticated }: QuestionCardProps) {
  const isMobile = useIsMobile();

  const metadataText = `${sanitizeEmail(q.author_email)} • ${new Date(q.created_at * 1000).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`;

  if (isMobile) {
    return (
      <div
        className="card-elevated"
        style={{
          backgroundColor: 'var(--card-bg)',
          padding: 16,
          borderRadius: 12,
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <p
          style={{
            margin: 0,
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            lineHeight: 1.5,
          }}
        >
          {q.content}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <Text
            UNSAFE_style={{
              fontSize: 12,
              color: 'var(--spectrum-neutral-subdued-content-color-default)',
            }}
          >
            {metadataText}
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ActionButton
              aria-label="upvote question"
              isQuiet
              size="S"
              onPress={() => onVote(q.id, 'up')}
              isDisabled={!isAuthenticated}
            >
              <ThumbUp styles={iconStyle({ color: 'positive' })} />
              <Text UNSAFE_style={{ fontSize: 13 }}>{q.upvotes}</Text>
            </ActionButton>
            <ActionButton
              aria-label="downvote question"
              isQuiet
              size="S"
              onPress={() => onVote(q.id, 'down')}
              isDisabled={!isAuthenticated}
            >
              <ThumbDown styles={iconStyle({ color: 'negative' })} />
              <Text UNSAFE_style={{ fontSize: 13 }}>{q.downvotes}</Text>
            </ActionButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card-elevated"
      style={{
        backgroundColor: 'var(--card-bg)',
        padding: 20,
        borderRadius: 12,
        width: '100%',
        boxSizing: 'border-box',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flex: 1,
            minWidth: 0,
          }}
        >
          <p
            style={{
              margin: 0,
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              lineHeight: 1.5,
            }}
          >
            {q.content}
          </p>
          <Text
            UNSAFE_style={{
              fontSize: 12,
              color: 'var(--spectrum-neutral-subdued-content-color-default)',
            }}
          >
            {metadataText}
          </Text>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <ActionButton
            aria-label="upvote question"
            isQuiet
            onPress={() => onVote(q.id, 'up')}
            isDisabled={!isAuthenticated}
          >
            <ThumbUp styles={iconStyle({ color: 'positive' })} />
            <Text styles={style({ color: 'GrayText' })}>{q.upvotes}</Text>
          </ActionButton>
          <ActionButton
            aria-label="downvote question"
            isQuiet
            onPress={() => onVote(q.id, 'down')}
            isDisabled={!isAuthenticated}
          >
            <ThumbDown styles={iconStyle({ color: 'negative' })} />
            <Text styles={style({ color: 'GrayText' })}>{q.downvotes}</Text>
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
