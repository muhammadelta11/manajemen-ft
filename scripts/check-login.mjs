import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const email = "arsip@fakultas.ac.id";
const password = "Password123!";

const user = await prisma.user.findUnique({ where: { email } });
console.log({
  found: !!user,
  active: user?.isActive,
  hasHash: !!user?.passwordHash,
  match: user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false,
});
await prisma.$disconnect();
