import { google } from "googleapis";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

async function testPermissions() {
  const fileId = "1A4IP2e1Tt2On6P2przh2Wshm2n4APAzt";

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  console.log("Testing GDrive Permissions for File:", fileId);
  console.log("Service Account:", process.env.GOOGLE_CLIENT_EMAIL);

  try {
    const res = await drive.files.get({
      fileId,
      fields: "id, name, capabilities, owners, parents, trashed",
      supportsAllDrives: true,
    });

    console.log("--- File Info ---");
    console.log("Name:", res.data.name);
    console.log("Trashed:", res.data.trashed);
    console.log("Parents:", res.data.parents);
    console.log(
      "Owners:",
      res.data.owners?.map((o: any) => o.emailAddress).join(", "),
    );
    console.log("--- Capabilities ---");
    console.log(JSON.stringify(res.data.capabilities, null, 2));

    const canRename = res.data.capabilities?.canRename;
    const canEdit = res.data.capabilities?.canEdit;

    console.log("--- Verdict ---");
    console.log("Can Rename:", canRename);
    console.log("Can Edit:", canEdit);

    if (!canRename) {
      console.log(
        "\nCAUSE: The service account has READ access but NOT RENAME access.",
      );
      console.log(
        'SOLUTION: Change the share permission for the service account from "Viewer" to "Editor" on the folder or file.',
      );
    } else {
      console.log("\nVerdict: Rename should work. Attempting a test rename...");
      try {
        await drive.files.update({
          fileId,
          requestBody: { name: res.data.name + "_test" },
          supportsAllDrives: true,
        });
        console.log("SUCCESS: Rename worked!");
        // Rename back
        await drive.files.update({
          fileId,
          requestBody: { name: res.data.name },
          supportsAllDrives: true,
        });
        console.log("SUCCESS: Renamed back to original.");
      } catch (err: any) {
        console.error("FAILURE during rename execution:", err.message);
        if (err.errors)
          console.error("Details:", JSON.stringify(err.errors, null, 2));
      }
    }
  } catch (err: any) {
    console.error("ERROR during diagnostic:", err.message);
    if (err.errors)
      console.error("Details:", JSON.stringify(err.errors, null, 2));
  }
}

testPermissions();
