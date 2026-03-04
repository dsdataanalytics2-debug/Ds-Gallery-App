import prisma from "./src/lib/prisma";
import "dotenv/config";

async function checkRecentTransfers() {
  console.log("--- Checking Recent Transfer Activity ---");
  try {
    const recentLogs = await prisma.auditLog.findMany({
      where: { action: "TRANSFER" },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    if (recentLogs.length === 0) {
      console.log("No recent TRANSFER logs found.");
    } else {
      console.log("Recent TRANSFER logs:");
      recentLogs.forEach((log) => {
        console.log(
          `- Time: ${log.timestamp}, User: ${log.userName} (${log.userId}), Folder: ${log.folderName} (${log.folderId})`,
        );
      });
    }

    const folders = await prisma.folder.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, ownerId: true, updatedAt: true },
    });
    console.log("\nRecently updated folders:");
    folders.forEach((f) => {
      console.log(
        `- Folder: ${f.name} (${f.id}), Owner: ${f.ownerId}, Updated: ${f.updatedAt}`,
      );
    });
  } catch (err) {
    console.error("Error checking database:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentTransfers();
