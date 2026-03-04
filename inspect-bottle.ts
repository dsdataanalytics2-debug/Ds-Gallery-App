import prisma from "./src/lib/prisma";
import "dotenv/config";

async function inspectBottleFolder() {
  console.log("--- Inspecting 'Bottle' Folder ---");
  try {
    const folders = await prisma.folder.findMany({
      where: { name: { contains: "Bottle", mode: "insensitive" } },
      include: {
        owner: { select: { email: true, name: true } },
        children: {
          include: {
            owner: { select: { email: true, name: true } },
          },
        },
      },
    });

    if (folders.length === 0) {
      console.log("No folder named 'Bottle' found.");
      return;
    }

    folders.forEach((f) => {
      console.log(`Folder: ${f.name} (ID: ${f.id})`);
      console.log(`  Owner: ${f.owner?.email || "N/A"}`);
      console.log(`  Children count: ${f.children.length}`);
      f.children.forEach((c) => {
        console.log(
          `    Child: ${c.name} (ID: ${c.id}), Owner: ${c.owner?.email || "N/A"}`,
        );
      });
    });

    const recentLogs = await prisma.auditLog.findMany({
      where: { action: "TRANSFER" },
      orderBy: { timestamp: "desc" },
      take: 5,
    });
    console.log("\nRecent TRANSFER logs:", recentLogs.length);
    recentLogs.forEach((l) =>
      console.log(
        `- ${l.timestamp}: ${l.folderName} transferred by ${l.userName}`,
      ),
    );
  } catch (err) {
    console.error("Error inspecting folder:", err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectBottleFolder();
