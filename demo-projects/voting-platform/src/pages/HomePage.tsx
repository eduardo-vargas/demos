import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heading,
  Text,
  Button,
  TextField,
  TextArea,
  Card,
  SegmentedControl,
  SegmentedControlItem,
  InlineAlert,
  Content,
} from '@react-spectrum/s2';
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };
import { createMeeting, getMeeting } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading/Loading';
import { JoinCodeInput, JoinCodeInputRef } from '../components/JoinCodeInput';
import PeopleGroup from '@react-spectrum/s2/icons/PeopleGroup';

export function HomePage() {
  const { user, loading } = useAuth();
  const [selectedView, setSelectedView] = useState<'create' | 'join'>('join');
  const [meetingName, setMeetingName] = useState('');
  const [meetingDesc, setMeetingDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isFading, setIsFading] = useState(false);
  const joinCodeInputRef = useRef<JoinCodeInputRef>(null);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!meetingName) {
      setError('Meeting name is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const meeting = await createMeeting(meetingName, meetingDesc);
      navigate(`/${meeting.short_code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (code: string) => {
    if (!code) {
      setJoinError('Meeting code is required');
      return;
    }
    setJoinError('');
    setSubmitting(true);
    try {
      await getMeeting(code.toUpperCase());
      await new Promise(resolve => setTimeout(resolve, 300)); // app jumps too quickly, adding a small delay to show the fade effect
      setIsFading(true);
      setTimeout(() => navigate(`/${code.toUpperCase()}`), 200);
    } catch {
      setJoinError('Meeting not found. Please check the code and try again.');
      setJoinCode('');
      joinCodeInputRef.current?.focusFirst();
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (joinError) {
      const timer = setTimeout(() => setJoinError(''), 2500);
      return () => clearTimeout(timer);
    }
  }, [joinError]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div
      className={style({ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' })}
    >
      <Heading level={1}>Voting Platform</Heading>
      <Text>Create or join a meeting to start collecting questions</Text>

      <Card
        UNSAFE_style={{
          width: '100%',
          maxWidth: 360,
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          opacity: isFading ? 0 : 1,
          transition: 'opacity 200ms ease-out',
        }}
      >
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 })}>
          <SegmentedControl
            selectedKey={selectedView}
            onSelectionChange={key => setSelectedView(key as 'create' | 'join')}
            aria-label="Meeting action"
            styles={style({ alignSelf: 'center' })}
          >
            <SegmentedControlItem id="create">Create</SegmentedControlItem>
            <SegmentedControlItem id="join">Join</SegmentedControlItem>
          </SegmentedControl>

          <div
            className={style({
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              minHeight: 220,
              flex: 1,
            })}
          >
            {selectedView === 'create' && (
              <>
                {user ? (
                  <>
                    <TextField
                      label="Meeting name"
                      value={meetingName}
                      onChange={setMeetingName}
                      placeholder="Meeting title or topic"
                    />
                    <TextArea
                      label="Description (optional)"
                      value={meetingDesc}
                      onChange={setMeetingDesc}
                      placeholder="Meeting description"
                    />
                    <Button
                      variant="accent"
                      onPress={handleCreate}
                      styles={style({ width: 'full', marginTop: 'auto' })}
                      isDisabled={submitting}
                    >
                      {submitting ? 'Creating...' : 'Create meeting'}
                    </Button>
                  </>
                ) : (
                  <Text>
                    Please authenticate to create meetings. You can join and view meetings without
                    authentication.
                  </Text>
                )}
              </>
            )}

            {selectedView === 'join' && (
              <>
                <JoinCodeInput value={joinCode} onChange={setJoinCode} onComplete={handleJoin} />
                {joinError && (
                  <InlineAlert variant="negative" fillStyle="subtleFill">
                    <Content>{joinError}</Content>
                  </InlineAlert>
                )}
                <Button
                  variant="accent"
                  onPress={() => handleJoin}
                  styles={style({ width: 'full', marginTop: 'auto' })}
                  UNSAFE_style={{ display: 'flex', flexDirection: 'row-reverse' }}
                  isDisabled={submitting || joinCode.length !== 6}
                >
                  <PeopleGroup />
                  <Text>{submitting ? 'Joining...' : 'Join meeting'}</Text>
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {error && <Text UNSAFE_className="text-error">{error}</Text>}
    </div>
  );
}
