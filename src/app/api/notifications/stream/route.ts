import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const tick = async () => {
        if (closed) return;
        try {
          const unread = await prisma.notification.count({
            where: { userId, readAt: null },
          });
          const latest = await prisma.notification.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: { id: true, judul: true, createdAt: true },
          });
          send("notifications", {
            unread,
            latestId: latest?.id ?? null,
            latestTitle: latest?.judul ?? null,
            latestAt: latest?.createdAt?.toISOString() ?? null,
          });
        } catch {
          send("error", { message: "poll_failed" });
        }
      };

      send("connected", { ok: true });
      void tick();

      const poll = setInterval(() => void tick(), 4000);
      const heartbeat = setInterval(() => {
        if (closed) return;
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15000);

      const onAbort = () => {
        closed = true;
        clearInterval(poll);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      };

      request.signal.addEventListener("abort", onAbort);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
