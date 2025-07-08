import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { db, storage, auth } from './firebaseconfig';
import * as FileSystem from 'expo-file-system';

export const uploadTestHunt = async () => {
  const user = auth.currentUser;
  if (!user) return { success: false, message: "Not logged in" };

  try {
    const huntFolders = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory || '');
    const hunts = huntFolders.filter(name => name.startsWith('hunt_') && !name.endsWith('.jpg'));

    for (const folder of hunts) {
      const folderUri = FileSystem.documentDirectory + folder + '/';

      const alreadyUploaded = await FileSystem.getInfoAsync(folderUri + '.uploaded');
      if (alreadyUploaded.exists) {
        console.log('Skipping already uploaded folder:', folder);
        continue;
      }

      const files = (await FileSystem.readDirectoryAsync(folderUri)).filter(f => f.endsWith('.jpg'));

      if (files.length === 0) {
        console.log('Skipping empty folder:', folder);
        continue;
      }

      const imageUris = files.map(f => folderUri + f);

      await addDoc(collection(db, `users/${user.uid}/hunts`), {
        folderName: folder,
        imageUris,
        timestamp: new Date().toISOString()
      });

      await FileSystem.writeAsStringAsync(folderUri + '.uploaded', 'true');

      console.log('Synced hunt with local URIs:', folder);
    }

    return { success: true };
  } catch (err) {
    console.error('Local-only sync failed:', err);
    return { success: false };
  }
};

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