import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const instant = false;

export default async function MasterPage() {
  const user = await requireUser();
  if (user.role !== "super_admin") redirect("/dashboard");

  const [prodi, kategori, tahun] = await Promise.all([
    prisma.prodi.findMany({ orderBy: { namaProdi: "asc" } }),
    prisma.kategoriSurat.findMany({ orderBy: { nama: "asc" } }),
    prisma.tahunAkademik.findMany({ include: { semesters: true }, orderBy: { kode: "desc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Master data</h1>
        <p className="text-sm text-stone-600">Prodi, kategori surat, tahun akademik (read-only MVP; kelola via seed/prisma studio)</p>
      </div>

      <Section title="Program studi">
        <ul className="text-sm">
          {prodi.map((p) => (
            <li key={p.id} className="border-b py-2 last:border-0">
              <span className="font-medium">{p.kodeProdi}</span> — {p.namaProdi}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Kategori surat">
        <ul className="text-sm">
          {kategori.map((k) => (
            <li key={k.id} className="border-b py-2 last:border-0">
              <span className="font-medium">{k.kode}</span> — {k.nama}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Tahun akademik">
        <ul className="text-sm">
          {tahun.map((t) => (
            <li key={t.id} className="border-b py-2 last:border-0">
              <span className="font-medium">{t.kode}</span>
              {t.isAktif ? " (aktif)" : ""}
              <div className="text-stone-500">
                {t.semesters.map((s) => s.label).join(", ")}
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white/80 p-5">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
