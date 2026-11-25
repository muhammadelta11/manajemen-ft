import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#07151d_0%,#0b2230_45%,#0d9488_100%)]" />
      <div className="login-orb absolute -left-24 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(201,162,39,0.35),transparent_68%)] blur-2xl" />
      <div
        className="login-orb absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.55),transparent_70%)] blur-2xl"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center gap-10 px-5 py-12 lg:flex-row lg:items-center lg:gap-16 lg:px-10">
        <div className="animate-fade-up max-w-xl text-white lg:flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#c9a227]">
            Universitas Wahid Hasyim
          </p>
          <h1 className="font-display mt-4 text-5xl leading-[0.95] tracking-tight md:text-6xl">
            Manajemen
            <span className="block text-teal-300">FT</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/70 md:text-lg">
            Persuratan, disposisi digital, dan aktivitas Tridarma dalam satu ruang kerja fakultas.
          </p>
        </div>

        <div className="animate-fade-up-delay-1 w-full max-w-md lg:flex-1">
          <div className="rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-1 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="rounded-[1.5rem] bg-white p-7 md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Masuk akun
              </p>
              <h2 className="font-display mt-2 text-2xl text-[var(--ink)]">Selamat datang kembali</h2>
              <p className="mt-1.5 text-sm text-[var(--muted)]">Gunakan akun demo fakultas Anda.</p>
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
