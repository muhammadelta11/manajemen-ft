import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export const instant = false;

export default async function MasterPage() {
  const user = await requireUser();
  if (user.role !== "super_admin") redirect("/dashboard");

  const admin = createAdminClient();
  const [prodi, kategori, tahun] = await Promise.all([
    admin.from("prodi").select("*").order("nama_prodi", { ascending: true }),
    admin.from("kategori_surat").select("*").order("nama", { ascending: true }),
    admin.from("tahun_akademik").select("*, semester(*)").order("kode", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Master data</h1>
        <p className="text-sm text-stone-600">Prodi, kategori surat, tahun akademik</p>
      </div>

      <Section title="Program studi">
        <ul className="text-sm">
          {(prodi.data ?? []).map((p) => (
            <li key={p.id} className="border-b py-2 last:border-0">
              <span className="font-medium">{p.kode_prodi}</span> — {p.nama_prodi}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Kategori surat">
        <ul className="text-sm">
          {(kategori.data ?? []).map((k) => (
            <li key={k.id} className="border-b py-2 last:border-0">
              <span className="font-medium">{k.kode}</span> — {k.nama}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Tahun akademik">
        <ul className="text-sm">
          {(tahun.data ?? []).map((t) => (
            <li key={t.id} className="border-b py-2 last:border-0">
              <span className="font-medium">{t.kode}</span>
              {t.is_aktif ? " (aktif)" : ""}
              <div className="text-stone-500">
                {((t.semester as { label: string }[]) ?? []).map((s) => s.label).join(", ")}
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
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
