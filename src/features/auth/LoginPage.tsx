import HeroPreview from "./components/HeroPreview";
import LoginForm from "./components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <section className="hidden flex-1 border-r border-slate-800 lg:block">
          <HeroPreview />
        </section>

        <section className="flex w-full items-center justify-center lg:w-[470px]">
          <LoginForm />
        </section>
      </div>
    </main>
  );
}