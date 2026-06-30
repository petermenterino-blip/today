import { useState } from 'react';
import { useEvents } from '../../../hooks/useEvents';
import { notificationStorage } from '../../../services/notificationStorage';
import { notifySuccess, notifyError } from '../../../utils/toast';
import type { User, NetworkEvent } from '../../../types';

function createDefaultEventData(): Partial<NetworkEvent> {
  return {
    title: '',
    description: '',
    category: 'Workshop',
    date: '',
    time: '',
    endTime: '',
    timezone: 'UTC',
    location: 'Zoom',
    meetingLink: '',
    venue: '',
    image: '',
    capacity: 50,
    registrationDeadline: '',
    speaker: '',
    visibility: 'public',
    status: 'published',
    tags: '',
    attendees: [],
    coverImage: '',
    duration: '',
    waitlistLimit: 0,
    resourceFiles: '',
    requirements: '',
    eventColor: '#000000',
  };
}

export function useEventManager(currentUser: User | null) {
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();

  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventErrors, setEventErrors] = useState<Record<string, string>>({});
  const [newEventData, setNewEventData] = useState<Partial<NetworkEvent>>(createDefaultEventData());

  const handleEditEventClick = (event: NetworkEvent) => {
    setEditingEventId(event.id);
    setNewEventData({
      title: event.title || '',
      description: event.description || '',
      category: event.category || 'Workshop',
      date: event.date || '',
      time: event.time || '',
      endTime: event.endTime || '',
      timezone: event.timezone || 'UTC',
      location: event.location || 'Zoom',
      meetingLink: event.meetingLink || '',
      venue: event.venue || '',
      image: event.image || '',
      capacity: event.capacity || 50,
      registrationDeadline: event.registrationDeadline || '',
      speaker: event.speaker || '',
      visibility: event.visibility || 'public',
      status: event.status || 'published',
      tags: event.tags || '',
      attendees: event.attendees || [],
      coverImage: event.coverImage || '',
      duration: event.duration || '',
      waitlistLimit: event.waitlistLimit || 0,
      resourceFiles: event.resourceFiles || '',
      requirements: event.requirements || '',
      eventColor: event.eventColor || '#000000',
    });
    setIsCreatingEvent(true);
  };

  const handleCancelEventEdit = () => {
    setIsCreatingEvent(false);
    setEditingEventId(null);
    setEventErrors({});
    setNewEventData(createDefaultEventData());
  };

  const handleSaveEvent = async () => {
    const errors: Record<string, string> = {};

    if (!newEventData.title?.trim()) errors.title = 'Workshop Title is required';
    if (!newEventData.description?.trim()) errors.description = 'Description is required';
    if (!newEventData.date) errors.date = 'Date is required';
    else if (isNaN(Date.parse(newEventData.date))) errors.date = 'Invalid date format';
    if (!newEventData.time) errors.time = 'Start Time is required';
    if (!newEventData.location) errors.location = 'Meeting Platform is required';
    if (newEventData.endTime && newEventData.time && newEventData.endTime <= newEventData.time) {
      errors.endTime = 'End Time must be after Start Time';
    }
    if (newEventData.registrationDeadline) {
      if (isNaN(Date.parse(newEventData.registrationDeadline))) {
        errors.registrationDeadline = 'Invalid deadline date format';
      } else if (newEventData.date && newEventData.registrationDeadline > newEventData.date) {
        errors.registrationDeadline = 'Registration Deadline cannot be after Event Date';
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        if (newEventData.registrationDeadline < todayStr) {
          errors.registrationDeadline = 'Registration Deadline cannot be in the past';
        }
      }
    }
    if (newEventData.capacity !== undefined && newEventData.capacity < 0) errors.capacity = 'Capacity cannot be negative';
    if (newEventData.waitlistLimit !== undefined && newEventData.waitlistLimit < 0) errors.waitlistLimit = 'Waitlist Limit cannot be negative';
    if (newEventData.meetingLink?.trim() && newEventData.location !== 'Offline') {
      const duplicate = events.find(e =>
        e.id !== editingEventId &&
        e.meetingLink?.trim().toLowerCase() === newEventData.meetingLink?.trim().toLowerCase()
      );
      if (duplicate) errors.meetingLink = `This meeting link is already in use by event: "${duplicate.title}"`;
    }

    if (Object.keys(errors).length > 0) {
      setEventErrors(errors);
      notifyError(Object.values(errors)[0]);
      return;
    }

    setEventErrors({});

    try {
      if (editingEventId) {
        const originalEvent = events.find(e => e.id === editingEventId);
        let updatedData = { ...newEventData };

        if (originalEvent) {
          const changedFields: string[] = [];
          const keysToCompare: (keyof typeof newEventData)[] = [
            'title', 'description', 'category', 'date', 'time', 'endTime',
            'timezone', 'location', 'meetingLink', 'venue', 'image', 'capacity',
            'registrationDeadline', 'speaker', 'visibility', 'status', 'tags',
            'coverImage', 'duration', 'waitlistLimit', 'resourceFiles', 'requirements', 'eventColor'
          ];
          for (const key of keysToCompare) {
            if (originalEvent[key] !== newEventData[key]) changedFields.push(key as string);
          }

          if (changedFields.length > 0) {
            const auditLogs = originalEvent.auditLogs || [];
            updatedData.auditLogs = [...auditLogs, {
              editedBy: currentUser?.name || 'Mentor',
              timestamp: new Date().toISOString(),
              changedFields
            }];
          }
        }

        await updateEvent(editingEventId, updatedData);

        if (originalEvent) {
          const scheduleChanged = originalEvent.date !== newEventData.date ||
            originalEvent.time !== newEventData.time ||
            originalEvent.endTime !== newEventData.endTime;
          const platformChanged = originalEvent.location !== newEventData.location ||
            originalEvent.meetingLink !== newEventData.meetingLink ||
            originalEvent.venue !== newEventData.venue;

          if ((scheduleChanged || platformChanged) && originalEvent.attendees && originalEvent.attendees.length > 0) {
            const updateMessage = `The event "${newEventData.title}" has been updated. New details - Date: ${newEventData.date}, Time: ${newEventData.time}. Platform: ${newEventData.location}.`;
            for (const attendeeId of originalEvent.attendees) {
              await notificationStorage.create({
                userId: attendeeId,
                title: `Schedule Updated: ${newEventData.title}`,
                message: updateMessage,
                read: false,
                type: 'system',
                link: '/events',
              });
            }
            notifySuccess(`Sent notification updates to ${originalEvent.attendees.length} participant(s)`);
          }
        }
        notifySuccess('Event updated successfully');
      } else {
        await addEvent({
          title: newEventData.title || '',
          description: newEventData.description || '',
          category: newEventData.category || 'Workshop',
          date: newEventData.date || '',
          time: newEventData.time || '',
          endTime: newEventData.endTime || '',
          timezone: newEventData.timezone || 'UTC',
          location: newEventData.location || 'Zoom',
          meetingLink: newEventData.meetingLink || '',
          venue: newEventData.venue || '',
          image: newEventData.image || '',
          capacity: newEventData.capacity || 50,
          registrationDeadline: newEventData.registrationDeadline || '',
          speaker: newEventData.speaker || '',
          visibility: newEventData.visibility || 'public',
          status: newEventData.status || 'published',
          tags: newEventData.tags || '',
          attendees: newEventData.attendees || [],
          coverImage: newEventData.coverImage || '',
          duration: newEventData.duration || '',
          waitlistLimit: newEventData.waitlistLimit || 0,
          resourceFiles: newEventData.resourceFiles || '',
          requirements: newEventData.requirements || '',
          eventColor: newEventData.eventColor || '#000000',
        });
        notifySuccess('Event scheduled successfully');
      }
      setIsCreatingEvent(false);
      setEditingEventId(null);
      setNewEventData(createDefaultEventData());
    } catch (err: any) {
      notifyError(err.message || 'Failed to save event');
    }
  };

  return {
    events,
    isCreatingEvent, setIsCreatingEvent,
    editingEventId, setEditingEventId,
    eventErrors, setEventErrors,
    newEventData, setNewEventData,
    handleEditEventClick,
    handleCancelEventEdit,
    handleSaveEvent,
    deleteEvent,
  };
}
