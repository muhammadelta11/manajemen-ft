import { exportAgendaExcelAction } from "@/app/actions/export";
import { ExportForm } from "@/components/export-form";

export const instant = false;

export default function AgendaPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl">Agenda & rekap surat</h1>
        <p className="text-sm text-stone-600">Ekspor Excel untuk periode yang dipilih (MVP Fase 1)</p>
      </div>
      <ExportForm label="Buku agenda surat" exporter={exportAgendaExcelAction} />
    </div>
  );
}
