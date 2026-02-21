import { google } from "googleapis";
import * as dotenv from "dotenv";

dotenv.config();

async function listFolder() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  console.log("Listing files in folder:", folderId);

  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, capabilities)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    console.log("--- Start of List ---");
    if (res.data.files && res.data.files.length > 0) {
      res.data.files.forEach((f) => {
        console.log(
          `ID: ${f.id} | Name: ${f.name} | Can Rename: ${f.capabilities?.canRename}`,
        );
      });
    } else {
      console.log("No files found in folder.");
    }
    console.log("--- End of List ---");
  } catch (err: any) {
    console.error("ERROR during list:", err.message);
  }
}

listFolder();
