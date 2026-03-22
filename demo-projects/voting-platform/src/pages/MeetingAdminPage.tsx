import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heading, Button } from '@react-spectrum/s2';
import { getMeeting } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading/Loading';
import { MeetingSettingsForm } from '../components/MeetingStatus';

export function MeetingAdminPage() {
  const { meetingId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [meetingUuid, setMeetingUuid] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Closed'>('Active');
  const [loading, setLoading] = useState(true);

  const loadMeeting = useCallback(async () => {
    if (!meetingId) return;
    try {
      const m = await getMeeting(meetingId);
      if (('error' in m && m.error) || m.user_role !== 'Owner') {
        navigate(`/${meetingId}`);
        return;
      }
      setMeetingUuid(m.id);
      setName(m.name);
      setDescription(m.description || '');
      setStatus(m.status);
    } catch {
      navigate(`/${meetingId}`);
    } finally {
      setLoading(false);
    }
  }, [meetingId, navigate]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/');
      return;
    }
    loadMeeting();
  }, [authLoading, user, navigate, loadMeeting]);

  if (loading || authLoading) return <Loading />;

  return (
    <div style={{ width: '100%', maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <Heading level={2}>Meeting Settings</Heading>
        <Button variant="secondary" onPress={() => navigate(`/${meetingId}`)}>
          Back to Meeting
        </Button>
      </div>

      <MeetingSettingsForm
        meetingId={meetingUuid}
        initialName={name}
        initialDescription={description}
        initialStatus={status}
      />
    </div>
  );
}
