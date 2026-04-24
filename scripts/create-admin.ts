import { config } from "dotenv";
config({ path: ".env" });

import { PrismaClient } from "../generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const auth = betterAuth({
  basePath: "/api/v1/auth",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: { type: "string", required: true, defaultValue: "STUDENT" },
    },
  },
});

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv.slice(4).join(" ");

  if (!email || !password || !name) {
    console.error("Usage: npm run create-admin <email> <password> <name>");
    process.exit(1);
  }

  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  if (!result?.user) {
    console.error("Failed to create user");
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: "ADMIN", status: "ACTIVE", emailVerified: true },
  });

  console.log(`Admin account created for ${email} (id: ${result.user.id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// npm run create-admin admin@binus.ac.id Binus12345678 "Yohanes Saputra"