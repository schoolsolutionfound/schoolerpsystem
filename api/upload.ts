import { storage, auth } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AppError } from '../utils/errorHandler';

export async function uploadProfilePictureApi(uri: string): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new AppError('User must be logged in to upload profile picture', 'UNAUTHORIZED', 401);
  }

  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profile_pics/${currentUser.uid}_${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error: any) {
    console.error('Upload API Storage Error:', error);
    throw new AppError('Failed to upload profile picture to storage.', 'STORAGE_UPLOAD_ERROR', 500);
  }
}

/** Generic document upload for Settings → Form Fields "document" type fields. */
export async function uploadDocumentApi(uri: string, fileName: string): Promise<{ name: string; url: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new AppError('User must be logged in to upload documents', 'UNAUTHORIZED', 401);
  }

  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const safeName = (fileName || 'document').replace(/[^\w.\-]+/g, '_');
    const storageRef = ref(storage, `profile_docs/${currentUser.uid}/${Date.now()}_${safeName}`);
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    return { name: fileName || safeName, url: downloadUrl };
  } catch (error: any) {
    console.error('Document Upload Error:', error);
    throw new AppError('Failed to upload document to storage.', 'STORAGE_UPLOAD_ERROR', 500);
  }
}
