import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading, Text, Button, TextField, TextArea, Card } from '@react-spectrum/s2';
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };
import { createMeeting } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading/Loading';

export function HomePage() {
  const { user, loading } = useAuth();
  const [meetingName, setMeetingName] = useState('');
  const [meetingDesc, setMeetingDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
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

  const handleJoin = () => {
    if (!joinCode) {
      setError('Meeting code is required');
      return;
    }
    setError('');
    navigate(`/${joinCode.toUpperCase()}`);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex-col" style={{ alignItems: 'center' }}>
      <Heading level={1}>Voting Platform</Heading>
      <Text>Create or join a meeting to start collecting questions</Text>

      <div
        className={style({
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          width: 'full',
          gap: 16,
        })}
      >
        {!user && (
          <Card>
            <Text>
              Please authenticate to create meetings. You can join and view meetings without
              authentication.
            </Text>
          </Card>
        )}

        <div
          className={style({
            display: 'flex',
            flexDirection: 'row',
            gap: 16,
            alignItems: 'stretch',
          })}
        >
          {user && (
            <Card>
              <Heading UNSAFE_style={{ marginTop: 0 }} level={3}>
                Create Meeting
              </Heading>
              <div className="flex-col" style={{ marginTop: 8 }}>
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
                  styles={style({ width: 'full' })}
                  isDisabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Meeting'}
                </Button>
              </div>
            </Card>
          )}

          <Card>
            <Heading UNSAFE_style={{ marginTop: 0 }} level={3}>
              Join Meeting
            </Heading>
            <div className="flex-col" style={{ marginTop: 8 }}>
              <TextField
                label="Meeting code"
                value={joinCode}
                onChange={setJoinCode}
                placeholder="ABC123"
              />
              <Button
                variant="secondary"
                onPress={handleJoin}
                isDisabled={submitting}
                styles={style({ width: 'full', marginTop: 'auto' })}
              >
                {submitting ? 'Joining...' : 'Join Meeting'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
      {error && <Text UNSAFE_className="text-error">{error}</Text>}
    </div>
  );
}
