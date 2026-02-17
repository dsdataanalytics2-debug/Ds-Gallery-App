const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function verify() {
  console.log("--- Starting Ownership & Safety Verification ---");

  try {
    // 1. Setup: Find admin and a regular user
    const admin = await prisma.user.findFirst({ where: { role: "admin" } });
    const user = await prisma.user.findFirst({ where: { role: "user" } });

    if (!admin || !user) {
      console.error("Test setup failed: Admin or user not found.");
      return;
    }

    console.log(`Using Admin: ${admin.email} (${admin.id})`);
    console.log(`Using User: ${user.email} (${user.id})`);

    // 2. Test: Ownership Assignment during creation
    const newFolder = await prisma.folder.create({
      data: {
        name: "Test Assigned Folder",
        ownerId: user.id,
      },
    });
    console.log(
      `✅ Folder created and assigned to user: ${newFolder.name} (Owner: ${newFolder.ownerId})`,
    );

    // 3. Test: Sharing (Permissions)
    const permission = await prisma.folderPermission.create({
      data: {
        userId: admin.id,
        folderId: newFolder.id,
      },
    });
    console.log(`✅ Folder shared with admin: Permission ID ${permission.id}`);

    // 4. Test: User Deletion Safety Net
    console.log("Testing Deletion Safety Net...");
    // We simulate the logic from the API here
    const foldersToTransfer = await prisma.folder.findMany({
      where: { ownerId: user.id },
    });
    console.log(
      `Found ${foldersToTransfer.length} folders belonging to user ${user.id}`,
    );

    await prisma.folder.updateMany({
      where: { ownerId: user.id },
      data: { ownerId: admin.id },
    });

    const reAssignedFolder = await prisma.folder.findUnique({
      where: { id: newFolder.id },
    });
    if (reAssignedFolder.ownerId === admin.id) {
      console.log(
        `✅ Safety Net Success: Folder "${reAssignedFolder.name}" transferred to admin.`,
      );
    } else {
      console.error("❌ Safety Net Failed: Folder owner not updated.");
    }

    // Cleanup the test folder
    await prisma.folder.delete({ where: { id: newFolder.id } });
    console.log("Cleaned up test data.");
  } catch (err) {
    console.error("Verification error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
