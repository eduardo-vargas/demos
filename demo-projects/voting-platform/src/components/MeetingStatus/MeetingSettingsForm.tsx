import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Button,
  TextField,
  TextArea,
  ToastQueue,
  ActionButton,
  Text,
  AlertDialog,
  DialogTrigger,
  Badge,
} from '@react-spectrum/s2';
import { updateMeeting, addOwner, removeOwner, getMeetingOwners } from '../../lib/api';
import { StatusToggle } from './StatusToggle';
import { Owner } from '../../types';
import Delete from '@react-spectrum/s2/icons/Delete';

interface MeetingSettingsFormProps {
  meetingId: string;
  initialName: string;
  initialDescription: string;
  initialStatus: 'Active' | 'Closed';
  onSaved?: () => void;
}

export function MeetingSettingsForm({
  meetingId,
  initialName,
  initialDescription,
  initialStatus,
  onSaved,
}: MeetingSettingsFormProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [status, setStatus] = useState<'Active' | 'Closed'>(initialStatus);
  const [newOwner, setNewOwner] = useState('');
  const [saving, setSaving] = useState(false);
  const [addingOwner, setAddingOwner] = useState(false);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [ownerToRemove, setOwnerToRemove] = useState<Owner | null>(null);
  const [removing, setRemoving] = useState(false);

  const isDirty = useMemo(
    () => name !== initialName || description !== initialDescription || status !== initialStatus,
    [name, description, status, initialName, initialDescription, initialStatus]
  );

  const loadOwners = useCallback(async () => {
    try {
      const data = await getMeetingOwners(meetingId);
      setOwners(data);
    } catch {
      ToastQueue.negative('Failed to load owners', { timeout: 3000 });
    } finally {
      setLoadingOwners(false);
    }
  }, [meetingId]);

  useEffect(() => {
    loadOwners();
  }, [loadOwners]);

  const handleSave = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      await updateMeeting(meetingId, { name, description, status });
      ToastQueue.positive('Meeting updated!', { timeout: 3000 });
      onSaved?.();
    } catch (e) {
      ToastQueue.negative(e instanceof Error ? e.message : 'Failed to update meeting', {
        timeout: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddOwner = async () => {
    if (!newOwner || addingOwner) return;
    setAddingOwner(true);
    try {
      await addOwner(meetingId, newOwner);
      setNewOwner('');
      ToastQueue.positive('Owner added!', { timeout: 3000 });
      loadOwners();
    } catch (e) {
      ToastQueue.negative(e instanceof Error ? e.message : 'Failed to add owner', {
        timeout: 5000,
      });
    } finally {
      setAddingOwner(false);
    }
  };

  const handleRemoveOwner = async () => {
    if (!ownerToRemove) return;
    setRemoving(true);
    try {
      await removeOwner(meetingId, ownerToRemove.id);
      ToastQueue.positive('Owner removed!', { timeout: 3000 });
      setOwnerToRemove(null);
      loadOwners();
    } catch (e) {
      ToastQueue.negative(e instanceof Error ? e.message : 'Failed to remove owner', {
        timeout: 5000,
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TextField label="Meeting name" value={name} onChange={setName} />
      <TextArea label="Description" value={description} onChange={setDescription} />
      <StatusToggle value={status} onChange={setStatus} />
      <Button
        variant="accent"
        onPress={handleSave}
        isDisabled={!isDirty || saving}
        UNSAFE_style={{ alignSelf: 'end' }}
      >
        Save Changes
      </Button>

      <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 16, marginTop: 16 }}>
        <span
          style={{
            fontFamily: 'adobe-clean, ui-sans-serif, system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 400,
            display: 'block',
            marginBottom: 8,
          }}
        >
          Add Owner
        </span>
        <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <TextField
              label="Email"
              value={newOwner}
              onChange={setNewOwner}
              placeholder="owner@example.com"
            />
          </div>
          <Button
            variant="secondary"
            onPress={handleAddOwner}
            isDisabled={addingOwner || !newOwner}
          >
            {addingOwner ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 16, marginTop: 16 }}>
        <span
          style={{
            fontFamily: 'adobe-clean, ui-sans-serif, system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 400,
            display: 'block',
            marginBottom: 8,
          }}
        >
          Current owners {owners.length > 0 && `(${owners.length})`}
        </span>
        {loadingOwners ? (
          <Text UNSAFE_style={{ color: 'var(--spectrum-neutral-subdued-content-color-default)' }}>
            Loading...
          </Text>
        ) : owners.length === 0 ? (
          <Text UNSAFE_style={{ color: 'var(--spectrum-neutral-subdued-content-color-default)' }}>
            No owners found
          </Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {owners.map(owner => (
              <div
                key={owner.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--spectrum-gray-100)',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text>{owner.email}</Text>
                  {owner.isCreator && <Badge variant="cinnamon">Creator</Badge>}
                </div>
                {!owner.isCreator && (
                  <DialogTrigger>
                    <ActionButton
                      isQuiet
                      onPress={() => setOwnerToRemove(owner)}
                      aria-label="Remove owner"
                    >
                      <Delete />
                    </ActionButton>
                    <AlertDialog
                      variant="destructive"
                      title="Remove Owner"
                      primaryActionLabel="Remove"
                      secondaryActionLabel="Cancel"
                      onPrimaryAction={handleRemoveOwner}
                      isPrimaryActionDisabled={removing}
                    >
                      Are you sure you want to remove{' '}
                      <Text UNSAFE_style={{ fontWeight: 600 }}>{owner.email}</Text> as an owner from{' '}
                      <Text UNSAFE_style={{ fontWeight: 600 }}>{initialName}</Text>?
                    </AlertDialog>
                  </DialogTrigger>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
