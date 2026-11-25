import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DataList, DataListEmpty, DataListRow } from "@/components/data-list";

export const instant = false;

const COLUMNS = [
  { key: "nama", label: "Nama" },
  { key: "nidn", label: "NIDN/NIP" },
  { key: "jenis", label: "Jenis" },
  { key: "prodi", label: "Prodi" },
];

export default async function PegawaiPage() {
  const user = await requireUser();
  if (user.role !== "admin_kepegawaian" && user.role !== "super_admin") {
    redirect("/dashboard");
  }

  const pegawai = await prisma.user.findMany({
    where: { role: "pegawai" },
    include: { prodi: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kepegawaian"
        title="Profil pegawai"
        description="Dosen & tendik terdaftar"
      />
      <DataList columns={COLUMNS}>
        {pegawai.map((p) => (
          <DataListRow key={p.id} columns={4}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[var(--ink)]">{p.name}</span>
              {p.isKaprodi ? (
                <Badge className="border-amber-200 bg-amber-50 text-amber-900">Kaprodi</Badge>
              ) : null}
            </div>
            <div className="text-[var(--muted)]">{p.nidnNip}</div>
            <div className="text-[var(--muted)]">{p.jenisPegawai ?? "—"}</div>
            <div className="text-[var(--muted)]">{p.prodi?.namaProdi ?? "—"}</div>
          </DataListRow>
        ))}
        {pegawai.length === 0 ? <DataListEmpty>Belum ada pegawai.</DataListEmpty> : null}
      </DataList>
    </div>
  );
}
