import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create a connection pool
const pool = new Pool({ connectionString });

// Create the adapter
const adapter = new PrismaPg(pool);

// Create Prisma Client with the adapter
const createPrismaClient = () => {
  return new PrismaClient({
    adapter,
  });
};

// Singleton pattern for Next.js
// In development, Next.js hot-reloads modules, which can create multiple instances
// This ensures we reuse the same Prisma Client instance
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
