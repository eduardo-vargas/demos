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
  Card,
  Divider,
} from '@react-spectrum/s2';
import { iconStyle, style } from '@react-spectrum/s2/style' with { type: 'macro' };
import { getUserMeetings } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Meeting } from '../types';
import { Loading } from '../components/Loading/Loading';
import { StatusPill, MeetingSettingsForm } from '../components/MeetingStatus';
import { getRoleDisplayName } from '../types';
import { useIsMobile } from '../hooks/useBreakpoint';
import PluginGear from '@react-spectrum/s2/icons/PluginGear';
import InfoCircle from '@react-spectrum/s2/icons/InfoCircle';
import ChevronLeft from '@react-spectrum/s2/icons/ChevronLeft';
import OpenIn from '@react-spectrum/s2/icons/OpenIn';

interface MeetingSettingsDialogProps {
  meeting: Meeting;
  trigger: React.ReactNode;
  onSaved?: () => void;
}

function MeetingSettingsDialog({ meeting, trigger, onSaved }: MeetingSettingsDialogProps) {
  return (
    <DialogTrigger>
      {trigger}
      <CustomDialog UNSAFE_style={{ width: 500, maxWidth: '90vw' }}>
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
                onSaved?.();
                close();
              }}
            />
          </div>
        )}
      </CustomDialog>
    </DialogTrigger>
  );
}

function sortMeetings(meetings: Meeting[]): Meeting[] {
  return [...meetings].sort((a, b) => {
    if (a.status === 'Active' && b.status === 'Closed') return -1;
    if (a.status === 'Closed' && b.status === 'Active') return 1;
    return b.created_at - a.created_at;
  });
}

interface MeetingCardProps {
  meeting: Meeting;
  onRefresh: () => void;
}

function MeetingCard({ meeting, onRefresh }: MeetingCardProps) {
  return (
    <Card styles={style({ width: '100%' })}>
      <div
        className={style({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        })}
      >
        <div className={style({ display: 'flex', alignItems: 'center', marginBottom: 8, flex: 1 })}>
          <Text UNSAFE_style={{ fontWeight: 500, flex: 1, wordBreak: 'break-word' }}>
            {meeting.name}
          </Text>
        </div>
      </div>

      {meeting.description && (
        <>
          <Text styles={style({ font: 'body-xs', color: 'neutral-subdued' })}>
            {meeting.description}
          </Text>
          <Divider styles={style({ marginY: 8 })} />
        </>
      )}

      <div
        className={style({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        })}
      >
        <StatusPill status={meeting.status} size="XS" />

        <a
          href={`/${meeting.short_code}`}
          style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
        >
          {meeting.short_code}
        </a>
        {meeting.user_role === 'Owner' ? (
          <MeetingSettingsDialog
            meeting={meeting}
            onSaved={onRefresh}
            trigger={
              <ActionButton aria-label="Settings" size="S" isQuiet>
                <PluginGear />
              </ActionButton>
            }
          />
        ) : (
          <Link to={`/${meeting.short_code}`} className={style({ textDecoration: 'none' })}>
            <ActionButton isQuiet aria-label="View meeting">
              <OpenIn />
            </ActionButton>
          </Link>
        )}
      </div>
    </Card>
  );
}

export function MyMeetingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();

  const loadMeetings = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserMeetings();
      setMeetings(sortMeetings(data));
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
    <div className={style({ display: 'flex', flexDirection: 'column', gap: 16 })}>
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

      {error && <Text styles={style({ color: 'negative' })}>{error}</Text>}

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
      ) : isMobile ? (
        <div
          className={style({ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 })}
        >
          {meetings.map(meeting => (
            <MeetingCard key={meeting.id} meeting={meeting} onRefresh={loadMeetings} />
          ))}
        </div>
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
            <Column key="actions" maxWidth="10%" align="center">
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
                      <MeetingSettingsDialog
                        meeting={meeting}
                        onSaved={() =>
                          getUserMeetings().then(data => setMeetings(sortMeetings(data)))
                        }
                        trigger={
                          <ActionButton aria-label="Admin" isQuiet>
                            <PluginGear />
                          </ActionButton>
                        }
                      />
                    ) : (
                      <Link
                        to={`/${meeting.short_code}`}
                        className={style({ textDecoration: 'none' })}
                      >
                        <ActionButton aria-label="Go to meeting" isQuiet size="S">
                          <OpenIn />
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
