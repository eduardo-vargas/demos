import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Heading,
  Text,
  Content,
  IllustratedMessage,
  ActionButton,
  Picker,
  PickerItem,
} from '@react-spectrum/s2';
import { getMeeting, getQuestions, addQuestion, voteQuestion } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Meeting, Question } from '../types';
import { Loading } from '../components/Loading/Loading';
import { StatusPill } from '../components/MeetingStatus';
import { QuestionInput } from '../components/QuestionInput';
import { style, iconStyle } from '@react-spectrum/s2/style' with { type: 'macro' };
import Checkmark from '@react-spectrum/s2/icons/Checkmark';
import { QuestionCard } from '../components/QuestionCard/QuestionCard';
import Settings from '@react-spectrum/s2/icons/Settings';
import Fuse from 'fuse.js';

interface HighlightedQuestion extends Question {
  highlightedContent: React.ReactNode[];
}

export function MeetingPage() {
  const { meetingId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'votes' | 'newest' | 'oldest'>('votes');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>('');
  const [copied, setCopied] = useState(false);

  const copyMeetingUrl = (shortCode: string) => {
    const url = `${window.location.origin}/${shortCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const loadData = useCallback(async () => {
    if (!meetingId) return;
    try {
      const m = await getMeeting(meetingId);
      if ('error' in m && m.error) {
        setError(m.error);
      } else {
        setMeeting(m as Meeting);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load meeting');
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  const loadQuestions = useCallback(async () => {
    if (!meetingId) return;
    try {
      const q = await getQuestions(meetingId, '', sort);
      setQuestions(q);
    } catch {
      // Silently fail for polling
    }
  }, [meetingId, sort]);

  useEffect(() => {
    if (authLoading) return;
    loadData();
  }, [authLoading, loadData]);

  useEffect(() => {
    if (authLoading || !meetingId) return;
    loadQuestions();
    const interval = setInterval(loadQuestions, 3000);
    return () => clearInterval(interval);
  }, [authLoading, meetingId, loadQuestions, sort]);

  const handleAddQuestion = async (question: string) => {
    if (!user) {
      setError('Please authenticate to add questions');
      return;
    }

    const tempId = Date.now();
    const optimisticQuestion = {
      id: tempId,
      meeting_id: meetingId!,
      author_id: '',
      author_email: user.email,
      content: question.trim(),
      created_at: Math.floor(Date.now() / 1000),
      upvotes: 1,
      downvotes: 0,
      user_vote: 'up' as const,
    };

    setQuestions(prev => [optimisticQuestion, ...prev]);
    setSubmitting(true);

    try {
      await addQuestion(meetingId!, question);
    } catch (e) {
      setQuestions(prev => prev.filter(q => q.id !== tempId));
      setError(e instanceof Error ? e.message : 'Failed to add question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = (questionId: number, type: 'up' | 'down') => {
    if (!user) {
      setError('Please authenticate to vote');
      return;
    }

    const previousQuestions = [...questions];

    setQuestions(prev =>
      prev.map(q => {
        if (q.id !== questionId) return q;

        let upvotes = q.upvotes;
        let downvotes = q.downvotes;
        let user_vote: 'up' | 'down' | null = q.user_vote;

        if (q.user_vote === type) {
          upvotes = Math.max(0, upvotes - 1);
          downvotes = Math.max(0, downvotes - 1);
          user_vote = null;
        } else if (q.user_vote === null) {
          if (type === 'up') {
            upvotes++;
          } else {
            downvotes++;
          }
          user_vote = type;
        } else {
          if (type === 'up') {
            upvotes++;
            downvotes = Math.max(0, downvotes - 1);
          } else {
            downvotes++;
            upvotes = Math.max(0, upvotes - 1);
          }
          user_vote = type;
        }

        return {
          ...q,
          upvotes,
          downvotes,
          user_vote,
        };
      })
    );

    voteQuestion(questionId, type).catch(() => {
      setQuestions(previousQuestions);
    });
  };

  const fuse = useMemo(
    () =>
      new Fuse(questions, {
        keys: ['content'],
        threshold: 0.4,
        includeMatches: true,
        ignoreLocation: true,
      }),
    [questions]
  );

  const highlightedQuestions = useMemo((): HighlightedQuestion[] => {
    if (!search.trim() || search.length < 2) {
      return [];
    }

    const results = fuse.search(search);

    return results.map(({ item, matches }) => {
      const contentMatch = matches?.find(m => m.key === 'content');
      const indices = (contentMatch?.indices || []) as [number, number][];
      const highlightedContent: React.ReactNode[] = [];
      let lastIndex = 0;

      for (const [start, end] of indices) {
        if (start > lastIndex) {
          highlightedContent.push(item.content.slice(lastIndex, start));
        }
        highlightedContent.push(
          <mark
            key={`${start}-${end}`}
            style={{
              backgroundColor: 'rgb(from var(--lavaLampFill, #F48120) r g b / 40%)',
              borderRadius: 2,
              padding: '0 2px',
            }}
          >
            {item.content.slice(start, end + 1)}
          </mark>
        );
        lastIndex = end + 1;
      }

      if (lastIndex < item.content.length) {
        highlightedContent.push(item.content.slice(lastIndex));
      }

      return { ...item, highlightedContent };
    });
  }, [fuse, search]);

  const displayQuestions =
    search.trim().length >= 2
      ? highlightedQuestions
      : questions.map(q => ({ ...q, highlightedContent: [q.content] }));

  if (loading || authLoading) return <Loading />;
  if (error) return <Text UNSAFE_className="text-error">{JSON.stringify(error)}</Text>;
  if (!meeting) return null;

  const isOwner = meeting.user_role === 'Owner';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 800,
        margin: '0 auto',
        padding: '0 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 16 })}>
          <Heading styles={style({ margin: 0 })} level={2}>
            {meeting.name}
          </Heading>
          {meeting.description && (
            <Text styles={style({ font: 'body-sm' })}>{meeting.description}</Text>
          )}
        </div>
        <div>
          <div
            className={style({ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' })}
          >
            <StatusPill status={meeting.status} />
            <ActionButton
              isQuiet
              size="S"
              isDisabled={copied}
              onPress={() => copyMeetingUrl(meeting.short_code)}
              UNSAFE_style={{ fontSize: 14, fontFamily: 'monospace' }}
            >
              {copied ? (
                <>
                  <Text styles={style({ color: 'green-800' })}>Copied!</Text>
                  <Checkmark styles={iconStyle({ color: 'positive' })} />
                </>
              ) : (
                <Text>Code: {meeting.short_code}</Text>
              )}
            </ActionButton>

            {isOwner && (
              <ActionButton
                aria-label="Settings"
                isQuiet
                onPress={() => navigate(`/${meetingId}/admin`)}
              >
                <Settings />
              </ActionButton>
            )}
          </div>
        </div>
      </div>

      {user && (
        <QuestionInput
          search={search}
          onSearchChange={setSearch}
          meetingStatus={meeting.status}
          onSubmit={handleAddQuestion}
          submitting={submitting}
        />
      )}

      {!user && (
        <div
          className={style({
            border: 'solid',
            boxShadow: 'elevated',
            borderRadius: 'lg',
          })}
          style={{
            backgroundColor: 'var(--card-bg)',
            padding: 24,
            borderRadius: 12,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <Text>Authenticate to add questions and vote</Text>
        </div>
      )}

      <div
        className={style({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        })}
      >
        <Heading level={3} styles={style({ margin: 0 })}>
          Questions ({questions.length})
        </Heading>
        <Picker
          aria-label="Sort by"
          isQuiet
          selectedKey={sort}
          onSelectionChange={key => setSort(key as 'votes' | 'newest' | 'oldest')}
        >
          <PickerItem id="votes">Most Voted</PickerItem>
          <PickerItem id="newest">Newest</PickerItem>
          <PickerItem id="oldest">Oldest</PickerItem>
        </Picker>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {displayQuestions.map(q => (
          <QuestionCard
            key={q.id}
            question={q}
            highlightedContent={'highlightedContent' in q ? q.highlightedContent : undefined}
            onVote={handleVote}
            isAuthenticated={!!user}
          />
        ))}
        {displayQuestions.length === 0 &&
          (questions.length === 0 ? (
            <IllustratedMessage styles={style({ alignSelf: 'center' })}>
              <Heading level={3}>No questions yet</Heading>
              <Content>Be the first to ask a question!</Content>
            </IllustratedMessage>
          ) : (
            <IllustratedMessage styles={style({ alignSelf: 'center' })}>
              <Heading level={3}>No similar questions yet</Heading>
              <Content>Be the first to ask that question!</Content>
            </IllustratedMessage>
          ))}
      </div>
    </div>
  );
}
