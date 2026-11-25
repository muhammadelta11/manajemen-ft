import { prisma } from "@/lib/prisma";

export async function notifyUser(input: {
  userId: string;
  tipe: string;
  judul: string;
  pesan: string;
  linkPath?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      tipe: input.tipe,
      judul: input.judul,
      pesan: input.pesan,
      linkPath: input.linkPath,
    },
  });
}

export async function notifyUsers(
  userIds: string[],
  payload: Omit<Parameters<typeof notifyUser>[0], "userId">,
) {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;
  await prisma.notification.createMany({
    data: unique.map((userId) => ({
      userId,
      tipe: payload.tipe,
      judul: payload.judul,
      pesan: payload.pesan,
      linkPath: payload.linkPath,
    })),
  });
}
