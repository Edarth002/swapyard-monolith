import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

//GRACEFUL SHUTDOWN

let isShuttingDown = false;

async function handleShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.warn({ signal }, `Received ${signal}. Draining database connections...`);

  // Force exit fallback if Prisma hangs past 10s
  const forceExit = setTimeout(() => {
    logger.error("Graceful shutdown timed out after 10s. Forcing exit.");
    process.exit(1);
  }, 10000);
  forceExit.unref();

  try {
    await prisma.$disconnect();
    logger.info("Prisma disconnected cleanly. Process exiting.");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error disconnecting Prisma during shutdown");
    process.exit(1);
  }
}

if (process.env.NODE_ENV === "production") {
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}