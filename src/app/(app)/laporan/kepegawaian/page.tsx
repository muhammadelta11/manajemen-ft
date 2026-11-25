import { exportAktivitasExcelAction } from "@/app/actions/export";
import { ExportForm } from "@/components/export-form";

export const instant = false;

export default function LaporanKepegawaianPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl">Laporan kepegawaian</h1>
        <p className="text-sm text-stone-600">Rekap aktivitas Tridarma (Excel)</p>
      </div>
      <ExportForm label="Rekap aktivitas" exporter={exportAktivitasExcelAction} />
    </div>
  );
}
