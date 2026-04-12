import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

export const sendInAppNotification = async (userId: string, title: string, message: string, type: Notification['type'] = 'info') => {
  try {
    await addDoc(collection(db, 'users', userId, 'notifications'), {
      title,
      message,
      type,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const sendEmailMock = async (email: string, subject: string, body: string) => {
  // In a real app, this would call an API like Resend, SendGrid, or a backend function.
  // For this environment, we simulate it by storing in an 'audit_logs' collection for audit.
  
  try {
    await addDoc(collection(db, 'audit_logs'), {
      type: 'email_sent',
      to: email,
      subject,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error logging email:', error);
  }
};

export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  const q = query(
    collection(db, 'users', userId, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
    callback(notifications);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `users/${userId}/notifications`);
  });
};
