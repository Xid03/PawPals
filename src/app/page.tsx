import { Cat, Heart, PawPrint } from "lucide-react";
import { CatMascot } from "@/components/CatMascot";
import { PrimaryButton } from "@/components/PrimaryButton";

export default function OnboardingPage() {
  return (
    <section className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-paw-radial px-6 pb-8 pt-14">
      <PawPrint className="absolute right-8 top-28 text-paw-peach" size={28} />
      <Heart className="absolute left-10 top-56 fill-paw-rose text-paw-rose" size={24} />
      <Heart className="absolute right-12 top-64 fill-paw-rose/60 text-paw-rose/60" size={20} />

      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-[2rem] text-5xl font-black tracking-normal text-paw-ink">
          <span className="drop-shadow-[0_4px_0_rgba(255,198,168,0.95)]">PawPals</span>
          <PawPrint className="fill-paw-butter text-paw-ink" size={44} />
        </div>
        <p className="mx-auto mt-6 max-w-52 text-base font-extrabold leading-relaxed text-paw-cocoa">
          A cozy community for you and your cat
        </p>
      </div>

      <div className="relative">
        <CatMascot />
        <div className="absolute -bottom-6 -right-10 h-28 w-48 rounded-t-full bg-white/45" />
      </div>

      <div className="space-y-3">
        <PrimaryButton href="/auth?mode=signup">Create Account</PrimaryButton>
        <PrimaryButton href="/auth?mode=login" variant="secondary" icon={<Cat size={18} />}>
          Log In
        </PrimaryButton>
        <PrimaryButton href="/home" variant="ghost" icon={<PawPrint size={17} />}>
          Continue as Guest
        </PrimaryButton>
      </div>
    </section>
  );
}
