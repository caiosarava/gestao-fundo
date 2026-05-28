import { getGoogleDrive, getDriveFolderId } from './google-sheets';

export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const drive = await getGoogleDrive();
  const folderId = getDriveFolderId();

  const fileMetadata = {
    name: `${Date.now()}-${fileName}`,
    parents: folderId ? [folderId] : undefined,
  };

  const media = {
    mimeType,
    body: fileBuffer,
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, webViewLink',
  });

  const fileId = response.data.id;
  
  await drive.permissions.create({
    fileId: fileId!,
    requestBody: {
      type: 'anyone',
      role: 'reader',
    },
  });

  const file = await drive.files.get({
    fileId: fileId!,
    fields: 'webViewLink',
  });

  return file.data.webViewLink || '';
}