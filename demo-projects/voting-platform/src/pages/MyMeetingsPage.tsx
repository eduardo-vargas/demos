import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heading,
  Text,
  ActionButton,
  Button,
  IllustratedMessage,
  CustomDialog,
  DialogTrigger,
  CloseButton,
  TableView,
  TableHeader,
  TableBody,
  Column,
  Row,
  Cell,
  Popover,
} from '@react-spectrum/s2';
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };
import { getUserMeetings } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Meeting } from '../types';
import { Loading } from '../components/Loading/Loading';
import { StatusPill, MeetingSettingsForm } from '../components/MeetingStatus';
import { getRoleDisplayName } from '../types';
import PluginGear from '@react-spectrum/s2/icons/PluginGear';
import InfoCircle from '@react-spectrum/s2/icons/InfoCircle';

export function MyMeetingsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/');
      return;
    }

    getUserMeetings()
      .then(setMeetings)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load meetings'))
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  if (loading || authLoading) return <Loading />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={2}>My Meetings</Heading>
        <Button variant="secondary" onPress={() => navigate('/')}>
          Back to Home
        </Button>
      </div>

      {error && (
        <Text UNSAFE_style={{ color: 'var(--spectrum-negative-content-color-default)' }}>
          {error}
        </Text>
      )}

      {meetings.length === 0 ? (
        <IllustratedMessage>
          <Heading level={3}>No meetings yet</Heading>
          <Text>Create a meeting to get started</Text>
          <Button variant="accent" onPress={() => navigate('/')}>
            Create Meeting
          </Button>
        </IllustratedMessage>
      ) : (
        <TableView aria-label="My Meetings" selectionMode="none">
          <TableHeader>
            <Column key="name">Meeting title</Column>
            <Column key="code">Code</Column>
            <Column key="status">Status</Column>
            <Column key="role">Role</Column>
            <Column key="actions" align="center">
              Actions
            </Column>
          </TableHeader>
          <TableBody>
            {meetings.map(meeting => (
              <Row key={meeting.id}>
                <Cell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text UNSAFE_style={{ fontWeight: 500 }}>{meeting.name}</Text>
                    {meeting.description && (
                      <DialogTrigger>
                        <ActionButton isQuiet size="S" aria-label="View description">
                          <InfoCircle />
                        </ActionButton>
                        <Popover
                          styles={style({ maxWidth: 300 })}
                          UNSAFE_style={{
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                          }}
                        >
                          <Text styles={style({ font: 'heading-2xs', paddingBottom: 4 })}>
                            Description:
                          </Text>
                          <Text styles={style({ font: 'body-sm', color: 'neutral-subdued' })}>
                            {meeting.description}
                          </Text>
                        </Popover>
                      </DialogTrigger>
                    )}
                  </div>
                </Cell>
                <Cell>
                  <a href={`/${meeting.short_code}`} style={{ fontFamily: 'monospace' }}>
                    {meeting.short_code}
                  </a>
                </Cell>
                <Cell>
                  <StatusPill status={meeting.status} />
                </Cell>
                <Cell>
                  <Text
                    UNSAFE_style={{
                      color: 'var(--spectrum-neutral-subdued-content-color-default)',
                    }}
                  >
                    {getRoleDisplayName(meeting.user_role)}
                  </Text>
                </Cell>

                <Cell align="center">
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {meeting.user_role === 'Owner' ? (
                      <DialogTrigger>
                        <ActionButton isQuiet>
                          <PluginGear />
                          <Text>Admin</Text>
                        </ActionButton>
                        <CustomDialog UNSAFE_style={{ width: 500 }}>
                          {({ close }) => (
                            <div style={{ position: 'relative' }}>
                              <CloseButton
                                onPress={close}
                                styles={style({ position: 'absolute', top: 0, insetEnd: 0 })}
                              />
                              <Heading
                                level={3}
                                UNSAFE_style={{
                                  marginTop: 0,
                                  marginRight: 32,
                                  wordBreak: 'break-word',
                                }}
                              >
                                {meeting.name} Settings
                              </Heading>
                              <MeetingSettingsForm
                                meetingId={meeting.id}
                                initialName={meeting.name}
                                initialDescription={meeting.description || ''}
                                initialStatus={meeting.status}
                                onSaved={() => {
                                  getUserMeetings().then(setMeetings);
                                  close();
                                }}
                              />
                            </div>
                          )}
                        </CustomDialog>
                      </DialogTrigger>
                    ) : (
                      <Button
                        variant="secondary"
                        size="S"
                        onPress={() => navigate(`/${meeting.short_code}`)}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </Cell>
              </Row>
            ))}
          </TableBody>
        </TableView>
      )}
    </div>
  );
}
