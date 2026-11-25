import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DataList, DataListEmpty, DataListRow } from "@/components/data-list";

export const instant = false;

const COLUMNS = [
  { key: "nama", label: "Nama" },
  { key: "role", label: "Role" },
  { key: "prodi", label: "Prodi" },
  { key: "status", label: "Status" },
];

export default async function UsersPage() {
  const user = await requireUser();
  if (user.role !== "super_admin") redirect("/dashboard");

  const users = await prisma.user.findMany({
    include: { prodi: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administrasi"
        title="Pengguna"
        description="Manajemen akun (seed / lihat daftar MVP)"
      />
      <DataList columns={COLUMNS}>
        {users.map((u) => (
          <DataListRow key={u.id} columns={4}>
            <div>
              <div className="font-semibold text-[var(--ink)]">{u.name}</div>
              <div className="text-xs text-[var(--muted)]">{u.email}</div>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge>{u.role}</Badge>
              {u.isKaprodi ? (
                <Badge className="border-amber-200 bg-amber-50 text-amber-900">Kaprodi</Badge>
              ) : null}
            </div>
            <div className="text-[var(--muted)]">{u.prodi?.namaProdi ?? "—"}</div>
            <div>{u.isActive ? "Aktif" : "Nonaktif"}</div>
          </DataListRow>
        ))}
        {users.length === 0 ? <DataListEmpty>Belum ada pengguna.</DataListEmpty> : null}
      </DataList>
    </div>
  );
}
