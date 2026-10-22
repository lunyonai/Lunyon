import { Navigate } from "react-router-dom";
import AuthBackdrop from "./components/AuthBackdrop";
import HeroPreview from "./components/HeroPreview";
import LoginForm from "./components/LoginForm";
import TopNav from "../landing/TopNav";
import { useAuth } from "../../hooks/useAuth";
import { useLocale } from "../../i18n/LocaleProvider";
import { resetPasswordPath } from "../../i18n/paths";

export default function LoginPage() {
  const { user, loading, recovering } = useAuth();
  const { locale } = useLocale();

  if (loading) {
    return <div className="min-h-screen bg-canvas" />;
  }

  if (recovering) {
    return <Navigate to={resetPasswordPath(locale)} replace />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-svh text-fg">
      <AuthBackdrop />
      <TopNav />

      <main className="relative z-10 flex min-h-svh pt-14">
        <section className="relative hidden min-h-[calc(100svh-3.5rem)] w-[60%] border-r border-line lg:flex">
          <HeroPreview />
        </section>

        <section className="relative flex min-h-[calc(100svh-3.5rem)] w-full items-center justify-center lg:w-[40%]">
          <LoginForm />
        </section>
      </main>
    </div>
  );
}
