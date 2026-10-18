import { storage, auth } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AppError } from '../utils/errorHandler';
import { useUserStore } from '../store/useUserStore';

export async function uploadProfilePictureApi(uri: string): Promise<string> {
  const currentUser = auth.currentUser;
  const storeEmail = useUserStore.getState().email;
  const uid = currentUser?.uid || (storeEmail ? storeEmail.replace(/[^a-zA-Z0-9]/g, '_') : `user_${Date.now()}`);

  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profile_pics/${uid}_${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error: any) {
    console.error('Upload API Storage Error:', error);
    if (uri) {
      console.warn('Falling back to direct photo URI');
      return uri;
    }
    throw new AppError('Failed to upload profile picture to storage.', 'STORAGE_UPLOAD_ERROR', 500);
  }
}
