import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    const testFolder = await prisma.folder.findFirst();
    if (!testFolder) {
      console.log("No folder found to test with");
      return;
    }

    const media = await prisma.media.create({
      data: {
        folderId: testFolder.id,
        fileName: "test_file_" + Date.now(),
        fileType: "image",
        fileFormat: "jpg",
        fileSize: 100,
        storagePath: "test_path",
        storageType: "local",
        storageFileId: "test_id",
        cdnUrl: "test_url",
      },
    });
    console.log("Creation successful:", media.id);
    await prisma.media.delete({ where: { id: media.id } });
    console.log("Cleanup successful");
  } catch (error) {
    console.error("Creation failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
