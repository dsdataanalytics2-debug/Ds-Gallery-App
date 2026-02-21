import { google } from "googleapis";
import * as dotenv from "dotenv";

dotenv.config();

async function listAll() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  console.log(
    "Listing ALL files accessible to:",
    process.env.GOOGLE_CLIENT_EMAIL,
  );

  try {
    const res = await drive.files.list({
      pageSize: 20,
      fields: "files(id, name, mimeType, parents)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    console.log("--- Accessible Files ---");
    if (res.data.files && res.data.files.length > 0) {
      res.data.files.forEach((f) => {
        console.log(`ID: ${f.id} | Name: ${f.name} | Parents: ${f.parents}`);
      });
    } else {
      console.log("Zero files visible to this service account.");
    }
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }
}

listAll();
