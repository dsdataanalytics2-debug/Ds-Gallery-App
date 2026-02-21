import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  // Basic connection test
  client
    .$connect()
    .then(() => console.log("Prisma: Connected to database successfully"))
    .catch((err) =>
      console.error("Prisma: Failed to connect to database:", err),
    );

  return client;
};

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
// Forced reload for schema updates
