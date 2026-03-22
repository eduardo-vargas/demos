import { ActionButton, Text } from '@react-spectrum/s2';
import ThumbUp from '@react-spectrum/s2/icons/ThumbUp';
import ThumbDown from '@react-spectrum/s2/icons/ThumbDown';
import type { Question } from '../../types';
import { sanitizeEmail } from '../MeetingStatus';
import { useIsMobile } from '../../hooks/useBreakpoint';
import { iconStyle, style } from '@react-spectrum/s2/style' with { type: 'macro' };

interface QuestionCardProps {
  question: Question;
  highlightedContent?: React.ReactNode[];
  onVote: (id: number, type: 'up' | 'down') => void;
  isAuthenticated: boolean;
}

const upVoteActiveIconStyle = iconStyle({ color: 'positive' });
const upVoteInactiveIconStyle = iconStyle({ color: 'gray' });
const downVoteActiveIconStyle = iconStyle({ color: 'negative' });
const downVoteInactiveIconStyle = iconStyle({ color: 'gray' });

export function QuestionCard({
  question: q,
  highlightedContent,
  onVote,
  isAuthenticated,
}: QuestionCardProps) {
  const isMobile = useIsMobile();

  const isUpvoted = q.user_vote === 'up';
  const isDownvoted = q.user_vote === 'down';

  return (
    <div
      className={style({
        backgroundColor: 'layer-2',
        border: `[1px solid var(--lightningcss-light, rgba(0, 0, 0, 0.1))
    var(--lightningcss-dark, rgba(255, 255, 255, 0.1))]`,
        boxShadow: `[0 2px 8px var(--lightningcss-light, rgba(0, 0, 0, 0.1))
    var(--lightningcss-dark, rgba(0, 0, 0, 0.3))]`,
        borderRadius: 'lg',
      })}
      style={{ padding: isMobile ? 16 : 20, width: '100%' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 8 : 16,
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 12 : 6,
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
            {highlightedContent || q.content}
          </p>
          <Text styles={style({ color: 'neutral-subdued', font: 'body-sm' })}>
            {sanitizeEmail(q.author_email)} •{' '}
            {new Date(q.created_at * 1000).toLocaleString(undefined, {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </Text>
        </div>
        <div
          className={`${style({ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 })} ${isMobile && style({ justifyContent: 'center', width: '100%' })}`}
        >
          <ActionButton
            aria-label="upvote question"
            aria-pressed={isUpvoted}
            isQuiet
            size={isMobile ? 'S' : undefined}
            onPress={() => onVote(q.id, 'up')}
            isDisabled={!isAuthenticated}
          >
            <ThumbUp styles={isUpvoted ? upVoteActiveIconStyle : upVoteInactiveIconStyle} />
            <Text styles={style({ font: 'body-sm', color: 'neutral-subdued' })}>{q.upvotes}</Text>
          </ActionButton>
          <ActionButton
            aria-label="downvote question"
            aria-pressed={isDownvoted}
            isQuiet
            size={isMobile ? 'S' : undefined}
            onPress={() => onVote(q.id, 'down')}
            isDisabled={!isAuthenticated}
          >
            <ThumbDown styles={isDownvoted ? downVoteActiveIconStyle : downVoteInactiveIconStyle} />
            <Text styles={style({ font: 'body-sm', color: 'neutral-subdued' })}>{q.downvotes}</Text>
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
