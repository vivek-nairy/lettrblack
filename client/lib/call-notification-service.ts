import { 
  createCallEvent, 
  updateCallEventStatus, 
  endCallEvent,
  createUserNotification,
  getFCMTokensForUsers,
  getGroup
} from './firestore-utils';
import { CallEvent } from './firestore-structure';

// Send FCM notification to users
async function sendFCMNotification(tokens: string[], notification: {
  title: string;
  body: string;
  data?: any;
}) {
  try {
    // In a real app, you'd send this to your backend API
    // For now, we'll simulate it with a console log
    console.log('Sending FCM notification:', {
      tokens,
      notification
    });

    // Example API call (you'd implement this on your backend):
    /*
    const response = await fetch('/api/send-fcm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokens,
        notification: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          click_action: notification.data?.url
        }
      })
    });
    */

    return true;
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    return false;
  }
}

// Send call notification to group members
export async function sendCallNotification(
  groupId: string,
  callerId: string,
  callerName: string,
  groupName: string
) {
  try {
    // Get group members
    const group = await getGroup(groupId);
    if (!group) {
      console.error('Group not found:', groupId);
      return;
    }

    // Filter out the caller
    const memberIds = group.memberIds.filter(id => id !== callerId);
    
    // Create call event
    await createCallEvent({
      groupId,
      status: 'calling',
      startedBy: callerId,
      startedByName: callerName,
      groupName,
      participants: memberIds,
    });

    // Get FCM tokens for all members
    const fcmTokens = await getFCMTokensForUsers(memberIds);
    const tokens = fcmTokens.map(token => token.token);

    // Send FCM notification
    if (tokens.length > 0) {
      await sendFCMNotification(tokens, {
        title: 'Incoming Group Call',
        body: `${callerName} started a call in ${groupName}`,
        data: {
          type: 'call_invite',
          groupId,
          callerId,
          callerName,
          groupName,
          url: `/chat/${groupId}`
        }
      });
    }

    // Create in-app notifications for each member
    const notificationPromises = memberIds.map(userId =>
      createUserNotification({
        userId,
        type: 'call_invite',
        title: 'Incoming Group Call',
        body: `${callerName} started a call in ${groupName}`,
        data: {
          groupId,
          callerId,
          callerName,
          groupName,
          url: `/chat/${groupId}`
        },
        isRead: false,
        expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
      })
    );

    await Promise.all(notificationPromises);

    console.log(`Call notification sent to ${memberIds.length} members`);
  } catch (error) {
    console.error('Error sending call notification:', error);
  }
}

// Update call status
export async function updateCallStatus(groupId: string, status: CallEvent['status']) {
  try {
    await updateCallEventStatus(groupId, status);
  } catch (error) {
    console.error('Error updating call status:', error);
  }
}

// End call and cleanup
export async function endCall(groupId: string) {
  try {
    await endCallEvent(groupId);
  } catch (error) {
    console.error('Error ending call:', error);
  }
}

// Send call ended notification
export async function sendCallEndedNotification(
  groupId: string,
  endedBy: string,
  endedByName: string,
  groupName: string
) {
  try {
    const group = await getGroup(groupId);
    if (!group) return;

    const memberIds = group.memberIds.filter(id => id !== endedBy);
    
    // Create notifications for remaining members
    const notificationPromises = memberIds.map(userId =>
      createUserNotification({
        userId,
        type: 'call_ended',
        title: 'Call Ended',
        body: `${endedByName} ended the call in ${groupName}`,
        data: {
          groupId,
          endedBy,
          endedByName,
          groupName
        },
        isRead: false,
        expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
      })
    );

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error sending call ended notification:', error);
  }
} 