import AuthBackdrop from "./components/AuthBackdrop";
import HeroPreview from "./components/HeroPreview";
import RecoveryForm from "./components/RecoveryForm";
import TopNav from "../landing/TopNav";

export default function RecoveryPage() {
  return (
    <div className="relative min-h-svh text-fg">
      <AuthBackdrop />
      <TopNav />

      <main className="relative z-10 flex min-h-svh pt-14">
        <section className="relative hidden min-h-[calc(100svh-3.5rem)] w-[60%] border-r border-line lg:flex">
          <HeroPreview />
        </section>

        <section className="relative flex min-h-[calc(100svh-3.5rem)] w-full items-center justify-center lg:w-[40%]">
          <RecoveryForm />
        </section>
      </main>
    </div>
  );
}
