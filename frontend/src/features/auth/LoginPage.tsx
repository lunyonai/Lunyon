import HeroPreview from "./components/HeroPreview";
import LoginForm from "./components/LoginForm";
import NeuralBackground from "../landing/NeuralBackground";
import TopNav from "../landing/TopNav";

export default function LoginPage() {
  return (
    <div className="relative min-h-svh text-[var(--lunyo-text)]">
      <NeuralBackground preset="login" />
      <TopNav />

      <main className="relative z-10 flex min-h-svh pt-14">
        <section className="relative hidden min-h-[calc(100svh-3.5rem)] w-[60%] border-r border-[var(--lunyo-border)] lg:flex">
          <HeroPreview />
        </section>

        <section className="relative flex min-h-[calc(100svh-3.5rem)] w-full items-center justify-center lg:w-[40%]">
          <LoginForm />
        </section>
      </main>
    </div>
  );
}
