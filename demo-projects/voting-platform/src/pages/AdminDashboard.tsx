import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading, Text, Button, Badge } from '@react-spectrum/s2';
import { getAdminMeetings } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading/Loading';
import type { Meeting } from '../types';

export function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMeetings = useCallback(async () => {
    try {
      const m = await getAdminMeetings();
      setMeetings(m);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/');
      return;
    }
    loadMeetings();
  }, [authLoading, user, navigate, loadMeetings]);

  if (loading || authLoading) return <Loading />;

  return (
    <>
      <Heading level={2}>Admin Dashboard</Heading>
      <Text UNSAFE_style={{ marginBottom: 16 }}>All Meetings</Text>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: 8 }}>Code</th>
            <th style={{ padding: 8 }}>Name</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Members</th>
            <th style={{ padding: 8 }}>Questions</th>
            <th style={{ padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {meetings.map(m => (
            <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8, fontFamily: 'monospace' }}>{m.short_code}</td>
              <td style={{ padding: 8 }}>{m.name}</td>
              <td style={{ padding: 8 }}>
                <Badge variant={m.status === 'Active' ? 'positive' : 'neutral'}>{m.status}</Badge>
              </td>
              <td style={{ padding: 8 }}>{m.member_count}</td>
              <td style={{ padding: 8 }}>{m.question_count}</td>
              <td style={{ padding: 8 }}>
                <Button variant="secondary" size="S" onPress={() => navigate(`/${m.short_code}`)}>
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {meetings.length === 0 && <Text>No meetings found</Text>}
    </>
  );
}
