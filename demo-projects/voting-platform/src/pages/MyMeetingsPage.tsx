import { useState, useEffect, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  Heading,
  Content,
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
import { iconStyle, style } from '@react-spectrum/s2/style' with { type: 'macro' };
import { getUserMeetings } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Meeting } from '../types';
import { Loading } from '../components/Loading/Loading';
import { StatusPill, MeetingSettingsForm } from '../components/MeetingStatus';
import { getRoleDisplayName } from '../types';
import PluginGear from '@react-spectrum/s2/icons/PluginGear';
import InfoCircle from '@react-spectrum/s2/icons/InfoCircle';
import ChevronLeft from '@react-spectrum/s2/icons/ChevronLeft';
import OpenIn from '@react-spectrum/s2/icons/OpenIn';

export function MyMeetingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMeetings = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserMeetings();
      setMeetings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    loadMeetings();
  }, [authLoading, loadMeetings]);

  if (authLoading) return <Loading />;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (loading) return <Loading />;

  return (
    <div className={style({ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 })}>
      <div
        className={style({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        })}
      >
        <Heading level={2}>My Meetings</Heading>
        <Link to="/" className={style({ textDecoration: 'none' })}>
          <ActionButton isQuiet>
            <ChevronLeft styles={iconStyle({ size: 'XS' })} />
            <Text>Back</Text>
          </ActionButton>
        </Link>
      </div>

      {error && (
        <Text UNSAFE_style={{ color: 'var(--spectrum-negative-content-color-default)' }}>
          {error}
        </Text>
      )}

      {meetings.length === 0 ? (
        <IllustratedMessage
          styles={style({
            alignSelf: 'center',
          })}
        >
          <Heading level={3}>No meetings yet</Heading>
          <Content
            styles={style({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            })}
          >
            Create a meeting to get started
            <Link to="/" className={style({ textDecoration: 'none' })}>
              <Button variant="accent">Create Meeting</Button>
            </Link>
          </Content>
        </IllustratedMessage>
      ) : (
        <TableView aria-label="My Meetings" selectionMode="none">
          <TableHeader>
            <Column key="status" maxWidth="15%">
              Status
            </Column>
            <Column key="name">Meeting title</Column>
            <Column key="role" maxWidth="15%">
              Role
            </Column>
            <Column key="code" maxWidth="15%">
              Code
            </Column>
            <Column key="actions" maxWidth="20%" align="center">
              Actions
            </Column>
          </TableHeader>
          <TableBody>
            {meetings.map(meeting => (
              <Row key={meeting.id}>
                <Cell>
                  <StatusPill status={meeting.status} />
                </Cell>
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
                  <Text
                    UNSAFE_style={{
                      color: 'var(--spectrum-neutral-subdued-content-color-default)',
                    }}
                  >
                    {getRoleDisplayName(meeting.user_role)}
                  </Text>
                </Cell>

                <Cell>
                  <a href={`/${meeting.short_code}`} style={{ fontFamily: 'monospace' }}>
                    {meeting.short_code}
                  </a>
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
                      <Link
                        to={`/${meeting.short_code}`}
                        className={style({ textDecoration: 'none' })}
                      >
                        <ActionButton isQuiet size="S">
                          <OpenIn />
                          <Text>View</Text>
                        </ActionButton>
                      </Link>
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
