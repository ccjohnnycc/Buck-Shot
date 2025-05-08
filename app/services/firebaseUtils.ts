import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebaseConfig';

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

export async function uploadCapturedImage(uri: string, userId: string) {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileRef = ref(storage, `images/${userId}_${Date.now()}.jpg`);
    await uploadBytes(fileRef, blob);
    const downloadURL = await getDownloadURL(fileRef);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error };
  }
}