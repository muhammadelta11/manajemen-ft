# -*- coding: utf-8 -*-
"""Generate panduan demo DOCX untuk Manajemen FT."""
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

OUT = Path(__file__).resolve().parents[1] / "docs" / "Panduan_Penggunaan_dan_Demo_Manajemen_FT.docx"


def set_run_font(run, size=11, bold=False, color=None):
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    run.bold = bold
    if color:
        run.font.color.rgb = color


def add_heading(doc, text, level=1):
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.name = "Calibri"
        run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    return h


def add_para(doc, text, *, bold=False, size=11, space_after=8, align=None):
    p = doc.add_paragraph()
    if align:
        p.alignment = align
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold)
    return p


def add_bullets(doc, items, level=0):
    for item in items:
        p = doc.add_paragraph(item, style="List Bullet")
        p.paragraph_format.left_indent = Cm(0.5 + level * 0.5)
        for run in p.runs:
            set_run_font(run, size=11)


def add_numbered(doc, items):
    for item in items:
        p = doc.add_paragraph(item, style="List Number")
        for run in p.runs:
            set_run_font(run, size=11)


def add_table(doc, headers, rows):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = h
        for p in hdr[i].paragraphs:
            for run in p.runs:
                set_run_font(run, size=10, bold=True)
    for r_i, row in enumerate(rows):
        cells = table.rows[r_i + 1].cells
        for c_i, val in enumerate(row):
            cells[c_i].text = str(val)
            for p in cells[c_i].paragraphs:
                for run in p.runs:
                    set_run_font(run, size=10)
    doc.add_paragraph()
    return table


def build():
    doc = Document()
    for section in doc.sections:
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(2.5)
        section.right_margin = Cm(2.5)

    # --- Cover ---
    add_para(doc, "UNIVERSITAS WAHID HASYIM", bold=True, size=14, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    add_para(doc, "Fakultas Teknik", bold=True, size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=24)
    add_para(
        doc,
        "PANDUAN PENGGUNAAN & MEKANISME SISTEM",
        bold=True,
        size=18,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=6,
    )
    add_para(
        doc,
        "Sistem Informasi Persuratan, Disposisi Digital\ndan Aktivitas Kepegawaian (Tridarma) Fakultas",
        bold=True,
        size=13,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=18,
    )
    add_para(doc, "Dokumen Bahan Demo Sistem (MVP)", size=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    add_para(
        doc,
        f"Versi 1.0 · {date.today().strftime('%d %B %Y')}",
        size=10,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=28,
    )
    add_para(
        doc,
        "Catatan strategis: dokumen ini menjelaskan konsep kerja dan cara demo pada prototipe "
        "saat ini (Next.js + Supabase). Setelah konsep disetujui pembimbing/dosen, implementasi "
        "produksi direncanakan dimigrasikan ke Laravel tanpa mengubah alur bisnis inti.",
        size=10,
        space_after=18,
    )

    # --- 1 ---
    add_heading(doc, "1. Tujuan Dokumen", 1)
    add_para(
        doc,
        "Dokumen ini disusun sebagai bahan presentasi/demo sistem kepada dosen pembimbing. "
        "Isinya mencakup: ringkasan konsep kerja, peran pengguna (RBAC), mekanisme alur bisnis, "
        "serta skenario demo langkah demi langkah menggunakan akun uji.",
    )
    add_bullets(
        doc,
        [
            "Menunjukkan bahwa proses persuratan & disposisi digital sudah terdokumentasi dan dapat dijalankan.",
            "Menunjukkan mekanisme pencatatan & validasi aktivitas Tridarma (Pengajaran, Penelitian, Pengabdian).",
            "Menjadi acuan bersama sebelum migrasi stack ke Laravel.",
        ],
    )

    # --- 2 ---
    add_heading(doc, "2. Ringkasan Sistem", 1)
    add_para(
        doc,
        "Manajemen FT adalah sistem informasi tingkat fakultas yang mendigitalisasi dua proses administrasi inti:",
    )
    add_numbered(
        doc,
        [
            "Persuratan & disposisi digital — pencatatan surat masuk/keluar, arsip berkas, disposisi pimpinan, tindak lanjut penerima, serta agenda/rekap.",
            "Aktivitas kepegawaian (Tridarma) — input mandiri oleh pegawai, validasi oleh Kaprodi, monitoring & rekap oleh Admin Kepegawaian/Pimpinan.",
        ],
    )
    add_heading(doc, "2.1 Tujuan bisnis", 2)
    add_bullets(
        doc,
        [
            "Mengurangi ketergantungan arsip kertas dan disposisi manual.",
            "Menyediakan jejak proses (status surat, disposisi, log validasi) yang dapat dilacak.",
            "Mempercepat monitoring capaian Tridarma per pegawai/prodi/fakultas.",
            "Memberi akses berbasis peran (RBAC) agar setiap aktor hanya melihat menu yang relevan.",
        ],
    )
    add_heading(doc, "2.2 Batasan MVP (yang didemokan)", 2)
    add_bullets(
        doc,
        [
            "Autentikasi email/password, sesi, dan pembatasan halaman per role.",
            "Modul surat, disposisi, aktivitas, validasi Kaprodi, notifikasi in-app, ekspor Excel (sesuai fitur yang aktif).",
            "Belum termasuk: TTE/BSrE, SSO universitas, multi-fakultas, OCR/AI.",
        ],
    )

    # --- 3 ---
    add_heading(doc, "3. Mekanisme Penggunaan (Konsep Kerja)", 1)
    add_heading(doc, "3.1 Peran pengguna (RBAC)", 2)
    add_para(
        doc,
        "Sistem memakai 5 role. Kaprodi bukan role terpisah, melainkan flag is_kaprodi pada role pegawai.",
    )
    add_table(
        doc,
        ["Role", "Tanggung jawab utama"],
        [
            ["Super Admin", "Kelola akun/role, master data (prodi, kategori, periode), konfigurasi."],
            ["Admin Arsip", "Catat surat masuk/keluar, unggah arsip, pantau disposisi & agenda."],
            ["Admin Kepegawaian", "Master profil pegawai, pantau/rekap Tridarma."],
            ["Pegawai (Dosen/Tendik)", "Input aktivitas sendiri; jika Kaprodi → validasi prodi."],
            ["Pimpinan (Dekan/WD)", "Buat disposisi surat masuk; pantau kepegawaian (view)."],
        ],
    )

    add_heading(doc, "3.2 Alur persuratan & disposisi", 2)
    add_para(doc, "Ringkasan status surat:", bold=True, space_after=4)
    add_para(
        doc,
        "tercatat → menunggu_disposisi → didisposisi → ditindaklanjuti → selesai → arsip",
        size=10,
        space_after=8,
    )
    add_numbered(
        doc,
        [
            "Admin Arsip mencatat surat (masuk/keluar), mengisi metadata, dan mengunggah berkas bila ada.",
            "Jika surat masuk butuh disposisi, status menjadi menunggu_disposisi.",
            "Pimpinan membuka antrean disposisi, memilih penerima, memberi catatan & batas waktu, lalu mengirim disposisi.",
            "Penerima (pegawai/unit) menindaklanjuti: belum → proses → selesai (atau diteruskan ke disposisi lanjutan).",
            "Admin Arsip memantau progres/overdue dan mengarsipkan setelah selesai.",
        ],
    )
    add_para(
        doc,
        "Prinsip penting: baris disposisi bersifat append-only (tidak diedit ulang). Koreksi dilakukan dengan disposisi baru atau catatan tindak lanjut.",
        size=10,
    )

    add_heading(doc, "3.3 Alur aktivitas Tridarma & validasi", 2)
    add_para(doc, "Ringkasan status validasi:", bold=True, space_after=4)
    add_para(
        doc,
        "draft → menunggu → disetujui  |  menunggu → revisi → (edit) → menunggu",
        size=10,
        space_after=8,
    )
    add_numbered(
        doc,
        [
            "Pegawai membuat aktivitas (pengajaran/penelitian/pengabdian), menyimpan sebagai draft, lalu mengajukan.",
            "Kaprodi (pegawai + is_kaprodi) melihat pengajuan menunggu di panel Validasi untuk prodi yang sama.",
            "Kaprodi menyetujui atau meminta revisi (dengan catatan).",
            "Jika revisi, pegawai memperbaiki lalu mengajukan ulang.",
            "Admin Kepegawaian / Pimpinan memantau rekap capaian (tanpa mengubah data milik pegawai).",
        ],
    )

    add_heading(doc, "3.4 Notifikasi", 2)
    add_bullets(
        doc,
        [
            "Surat menunggu disposisi → notifikasi ke pimpinan.",
            "Disposisi baru/diteruskan → notifikasi ke penerima.",
            "Hasil validasi Kaprodi → notifikasi ke pegawai.",
            "Badge notifikasi tampil di antarmuka; daftar lengkap di menu Notifikasi.",
        ],
    )

    # --- 4 ---
    add_heading(doc, "4. Akun Demo untuk Presentasi", 1)
    add_para(doc, "Password semua akun demo: Password123!", bold=True)
    add_table(
        doc,
        ["Email", "Peran di demo", "Fokus skenario"],
        [
            ["arsip@fakultas.ac.id", "Admin Arsip", "Catat surat, pantau disposisi, agenda"],
            ["dekan@fakultas.ac.id", "Pimpinan (Dekan)", "Buat disposisi"],
            ["dosen.if@fakultas.ac.id", "Pegawai / Dosen", "Terima disposisi; input aktivitas"],
            ["kaprodi.if@fakultas.ac.id", "Kaprodi Informatika", "Validasi aktivitas prodi"],
            ["kepegawaian@fakultas.ac.id", "Admin Kepegawaian", "Pantau pegawai & rekap"],
            ["admin@fakultas.ac.id", "Super Admin", "Users & master data (opsional)"],
            ["tendik@fakultas.ac.id", "Pegawai / Tendik", "Aktivitas tendik (opsional)"],
        ],
    )
    add_para(
        doc,
        "URL akses: lingkungan lokal (http://localhost:3000) atau URL deployment demo (Vercel) yang disiapkan presenter.",
        size=10,
    )

    # --- 5 ---
    add_heading(doc, "5. Skenario Demo (Disarankan 10–15 menit)", 1)
    add_para(
        doc,
        "Urutan berikut dirancang agar dosen melihat alur ujung-ke-ujung tanpa loncat konsep. "
        "Gunakan dua browser/profil (atau logout–login) untuk berganti peran.",
    )

    add_heading(doc, "Skenario A — Persuratan & Disposisi (utama)", 2)
    add_para(doc, "A1. Login sebagai Admin Arsip (arsip@fakultas.ac.id)", bold=True, space_after=4)
    add_numbered(
        doc,
        [
            "Buka menu Surat → Catat/Buat surat baru.",
            "Pilih jenis Surat Masuk, isi nomor, tanggal, asal, perihal, ringkasan.",
            "Centang/aktifkan butuh disposisi (jika ada opsi).",
            "Simpan. Tunjukkan status menunggu_disposisi di daftar surat.",
            "(Opsional) Tunjukkan detail surat dan metadata arsip.",
        ],
    )
    add_para(doc, "A2. Login sebagai Pimpinan / Dekan (dekan@fakultas.ac.id)", bold=True, space_after=4)
    add_numbered(
        doc,
        [
            "Buka Dashboard atau Disposisi — tunjukkan antrean yang menunggu arahan.",
            "Buka surat terkait → buat disposisi ke dosen.if@fakultas.ac.id.",
            "Isi catatan disposisi dan batas waktu, kirim.",
            "Tunjukkan status surat berubah menjadi didisposisi.",
        ],
    )
    add_para(doc, "A3. Login sebagai Pegawai penerima (dosen.if@fakultas.ac.id)", bold=True, space_after=4)
    add_numbered(
        doc,
        [
            "Buka Notifikasi / Disposisi — tunjukkan disposisi masuk.",
            "Ubah status tindak lanjut: proses, lalu selesai (sesuai UI yang tersedia).",
            "Jelaskan bahwa hanya penerima disposisi yang berhak menutup tindak lanjut.",
        ],
    )
    add_para(doc, "A4. Kembali ke Admin Arsip", bold=True, space_after=4)
    add_numbered(
        doc,
        [
            "Tunjukkan pantauan disposisi / status surat yang sudah ditindaklanjuti.",
            "(Opsional) Buka Agenda / ekspor bila tersedia di demo.",
        ],
    )

    add_heading(doc, "Skenario B — Aktivitas Tridarma & Validasi Kaprodi", 2)
    add_para(doc, "B1. Login sebagai Dosen (dosen.if@fakultas.ac.id)", bold=True, space_after=4)
    add_numbered(
        doc,
        [
            "Menu Aktivitas → Buat aktivitas baru (mis. Penelitian).",
            "Isi judul, tanggal, peran, deskripsi, bukti (file/URL jika tersedia).",
            "Simpan draft → Ajukan (status menunggu).",
        ],
    )
    add_para(doc, "B2. Login sebagai Kaprodi IF (kaprodi.if@fakultas.ac.id)", bold=True, space_after=4)
    add_numbered(
        doc,
        [
            "Buka menu Validasi.",
            "Tinjau pengajuan dosen di prodi yang sama.",
            "Pilih Setujui, atau Revisi dengan catatan (lalu tunjukkan dosen memperbaiki).",
        ],
    )
    add_para(doc, "B3. Login sebagai Admin Kepegawaian (opsional singkat)", bold=True, space_after=4)
    add_numbered(
        doc,
        [
            "Tunjukkan daftar pegawai / laporan kepegawaian sebagai monitoring fakultas.",
        ],
    )

    add_heading(doc, "Skenario C — Hak akses (30–60 detik)", 2)
    add_para(
        doc,
        "Login sebagai Pegawai biasa lalu coba buka /users atau /master — sistem mengarahkan/ memblokir. "
        "Ini menegaskan RBAC bekerja sebelum migrasi ke Laravel.",
    )

    # --- 6 ---
    add_heading(doc, "6. Matriks Akses Halaman (Ringkas)", 1)
    add_table(
        doc,
        ["Halaman", "Who dapat akses"],
        [
            ["/login", "Publik"],
            ["/dashboard, /notifikasi, /profil", "Semua role terautentikasi"],
            ["/surat, /agenda", "Admin Arsip, Pimpinan, Super Admin"],
            ["/disposisi", "Pimpinan, penerima, Admin Arsip (pantau), dll. sesuai RBAC"],
            ["/aktivitas", "Pegawai, Admin Kepegawaian, Pimpinan, Super Admin"],
            ["/validasi", "Pegawai + flag Kaprodi"],
            ["/pegawai, /laporan/kepegawaian", "Admin Kepegawaian, Pimpinan, Super Admin"],
            ["/users, /master", "Super Admin"],
        ],
    )

    # --- 7 ---
    add_heading(doc, "7. Checklist Presenter Sebelum Demo", 1)
    add_bullets(
        doc,
        [
            "Pastikan database sudah di-seed (akun demo tersedia).",
            "Siapkan minimal 2 sesi browser (Admin Arsip ↔ Pimpinan/Pegawai).",
            "Siapkan 1 contoh file PDF/JPG untuk unggah arsip (opsional).",
            "Tutup notifikasi OS yang mengganggu layar sharing.",
            "Siapkan kalimat penutup: konsep alur sudah sesuai PRD; tahap berikutnya migrasi ke Laravel setelah persetujuan dosen.",
        ],
    )

    # --- 8 ---
    add_heading(doc, "8. Catatan Migrasi ke Laravel (Ke Depan)", 1)
    add_para(
        doc,
        "Prototipe saat ini dibangun dengan Next.js + Supabase untuk mempercepat validasi konsep. "
        "Ketika dosen menyetujui mekanisme kerja, migrasi ke Laravel akan menjaga:",
    )
    add_bullets(
        doc,
        [
            "Model role & matriks akses yang sama.",
            "State machine surat dan aktivitas yang sama.",
            "Alur demo (Admin Arsip → Pimpinan → Penerima; Pegawai → Kaprodi) tetap menjadi acceptance criteria.",
            "Data master (prodi, kategori, periode) dan skema inti dipetakan ulang ke Eloquent/migrasi Laravel.",
        ],
    )
    add_para(
        doc,
        "Dengan demikian, demo ini menilai kesesuaian proses bisnis, bukan ketetapan stack teknologi akhir.",
        size=10,
    )

    # --- 9 ---
    add_heading(doc, "9. Penutup", 1)
    add_para(
        doc,
        "Dokumen ini dapat dilampirkan pada laporan kemajuan atau dipakai sebagai handout saat demo. "
        "Jika dosen meminta penyesuaian alur (misalnya disposisi wajib multi-level, atau validasi WD), "
        "catat sebagai change request sebelum migrasi Laravel agar scope produksi jelas.",
    )

    add_para(doc, "— Akhir dokumen —", size=10, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=0)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
