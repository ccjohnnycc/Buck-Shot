import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function uploadTestHunt() {
  try {
    const docRef = await addDoc(collection(db, 'hunts'), {
      hunter: 'Josh',
      score: 155,
      timestamp: new Date().toISOString(),
      location: 'Test Spot',
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error uploading hunt:', error);
    return { success: false, error };
  }
}