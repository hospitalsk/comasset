import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Google Drive scope for files created/used by this app (Scope minimization / least privilege)
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account'
});

// Flag to track sign-in in progress
let isSigningIn = false;
// In-memory access token cache (CRITICAL: Do NOT store in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;

export const isGoogleDriveConnected = (): boolean => {
  return Boolean(cachedAccessToken);
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token not in memory; user needs to re-authenticate or click connect
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Perform Google Sign-in via Popup.
 * MUST be called directly from a synchronous user pointer click event.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    // Direct popup call within user click context
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ไม่พบ Access Token จากการเข้าสู่ระบบ Google Workspace');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code === 'auth/popup-blocked') {
      console.warn('Google Sign-in popup was blocked by the browser.');
      const customErr = new Error('POPUP_BLOCKED');
      (customErr as any).code = 'auth/popup-blocked';
      throw customErr;
    }
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Upload an image file (Logo or Emblem) to Google Drive in the app's folder.
 * NOTE: Does NOT trigger popups automatically to avoid auth/popup-blocked errors in async handlers.
 */
export async function uploadImageToGoogleDrive(
  file: File | Blob,
  fileName: string,
  folderName: string = 'Assetcom_Branding'
): Promise<{ fileId: string; directUrl: string; webViewLink: string }> {
  const token = cachedAccessToken;
  if (!token) {
    const notConnectedErr = new Error('NOT_CONNECTED');
    (notConnectedErr as any).code = 'GOOGLE_DRIVE_NOT_CONNECTED';
    throw notConnectedErr;
  }

  // 1. Check or create application folder in Google Drive
  let folderId: string | null = null;
  try {
    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`
      )}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (listRes.ok) {
      const listData = await listRes.json();
      if (listData.files && listData.files.length > 0) {
        folderId = listData.files[0].id;
      }
    }
  } catch (err) {
    console.warn('Folder search error, will upload to root if needed:', err);
  }

  if (!folderId) {
    try {
      const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          description: 'โฟลเดอร์จัดเก็บโลโก้และตราสัญลักษณ์ระบบบริหารจัดการครุภัณฑ์ Assetcom'
        })
      });
      if (createFolderRes.ok) {
        const folderData = await createFolderRes.json();
        folderId = folderData.id;
      }
    } catch (e) {
      console.warn('Could not create folder, proceeding without folder:', e);
    }
  }

  // 2. Upload file via multipart upload
  const metadata = {
    name: fileName,
    description: 'Uploaded via Thai Gov Asset Management System',
    parents: folderId ? [folderId] : undefined
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
  const fileBuffer = await fileDataPromise;

  const metadataContentType = 'Content-Type: application/json; charset=UTF-8\r\n\r\n';
  const mediaContentType = `Content-Type: ${file.type || 'image/png'}\r\n\r\n`;

  const encoder = new TextEncoder();
  const part1 = encoder.encode(delimiter + metadataContentType + JSON.stringify(metadata) + delimiter + mediaContentType);
  const part2 = new Uint8Array(fileBuffer);
  const part3 = encoder.encode(closeDelimiter);

  const fullPayload = new Uint8Array(part1.length + part2.length + part3.length);
  fullPayload.set(part1, 0);
  fullPayload.set(part2, part1.length);
  fullPayload.set(part3, part1.length + part2.length);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,thumbnailLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: fullPayload
    }
  );

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`อัปโหลดไปยัง Google Drive ล้มเหลว (${uploadRes.status}): ${errorText}`);
  }

  const uploadResult = await uploadRes.json();
  const fileId = uploadResult.id;

  // 3. Make file accessible for preview (anyone with link can read)
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  } catch (permErr) {
    console.warn('Set permission warning:', permErr);
  }

  // Google Drive direct image URL format
  const directUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  const webViewLink = uploadResult.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

  return {
    fileId,
    directUrl,
    webViewLink
  };
}
