import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Heading,
  Text,
  Button,
  TextField,
  IllustratedMessage,
  ActionButton,
  Picker,
  PickerItem,
} from '@react-spectrum/s2';
import { getMeeting, getQuestions, addQuestion, voteQuestion } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Meeting, Question } from '../types';
import Fuse from 'fuse.js';
import { Loading } from '../components/Loading/Loading';
import { StatusPill } from '../components/MeetingStatus';
import { style, iconStyle } from '@react-spectrum/s2/style' with { type: 'macro' };
import Checkmark from '@react-spectrum/s2/icons/Checkmark';
import { QuestionCard } from '../components/QuestionCard/QuestionCard';

export function MeetingPage() {
  const { meetingId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'votes' | 'newest' | 'oldest'>('votes');
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>('');
  const [copied, setCopied] = useState(false);

  const copyMeetingUrl = (shortCode: string) => {
    const url = `${window.location.origin}/${shortCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const handleAddQuestion = async () => {
    if (!newQuestion.trim() || submitting) return;
    if (!user) {
      setError('Please authenticate to add questions');
      return;
    }
    setSubmitting(true);
    try {
      await addQuestion(meetingId!, newQuestion);
      setNewQuestion('');
      loadQuestions();
    } catch (e) {
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
        return {
          ...q,
          upvotes: type === 'up' ? q.upvotes + 1 : q.upvotes,
          downvotes: type === 'down' ? q.downvotes + 1 : q.downvotes,
        };
      })
    );

    voteQuestion(questionId, type).catch(() => {
      setQuestions(previousQuestions);
    });
  };

  const fuse = useMemo(
    () => new Fuse(questions, { keys: ['content'], threshold: 0.4 }),
    [questions]
  );
  const displayQuestions = search ? fuse.search(search).map(r => r.item) : questions;

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
        <div className="flex-col">
          <Heading level={2}>{meeting.name}</Heading>
          {meeting.description && <Text>{meeting.description}</Text>}
          <div className="flex-row" style={{ marginTop: 4, gap: 8, alignItems: 'center' }}>
            <StatusPill status={meeting.status} />
            <ActionButton
              isQuiet
              size="S"
              onPress={() => copyMeetingUrl(meeting.short_code)}
              UNSAFE_style={{ fontSize: 14, fontFamily: 'monospace' }}
            >
              <Text>Code: {meeting.short_code}</Text>
            </ActionButton>
            {copied && (
              <div className="flex-row" style={{ alignItems: 'center', gap: 4 }}>
                <Text
                  UNSAFE_style={{
                    fontSize: 14,
                    color: 'var(--spectrum-positive-content-color-default)',
                  }}
                >
                  Copied!
                </Text>
                <Checkmark styles={iconStyle({ color: 'positive' })} />
              </div>
            )}
          </div>
        </div>
        {isOwner && (
          <Button variant="secondary" onPress={() => navigate(`/${meetingId}/admin`)}>
            Admin
          </Button>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 16,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <TextField
            label="Search"
            placeholder="Search questions..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <Picker
          label="Sort by"
          selectedKey={sort}
          onSelectionChange={key => setSort(key as 'votes' | 'newest' | 'oldest')}
        >
          <PickerItem id="votes">Most Voted</PickerItem>
          <PickerItem id="newest">Newest</PickerItem>
          <PickerItem id="oldest">Oldest</PickerItem>
        </Picker>
      </div>

      {user && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <TextField
            label="Ask a question"
            value={newQuestion}
            onChange={setNewQuestion}
            placeholder="Type your question..."
            onKeyDown={e => e.key === 'Enter' && handleAddQuestion()}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="accent"
              onPress={handleAddQuestion}
              isDisabled={meeting.status === 'Closed' || !newQuestion.trim() || submitting}
            >
              {submitting ? 'Adding...' : 'Add question'}
            </Button>
          </div>
        </div>
      )}

      {!user && (
        <div
          className="card-elevated"
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
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: '100%',
        }}
      >
        {displayQuestions.map(q => (
          <QuestionCard key={q.id} question={q} onVote={handleVote} isAuthenticated={!!user} />
        ))}
        {displayQuestions.length === 0 && (
          <IllustratedMessage styles={style({ alignSelf: 'center' })}>
            <Heading level={3}>No questions yet</Heading>
            <Text>Be the first to ask a question!</Text>
          </IllustratedMessage>
        )}
      </div>
    </div>
  );
}
