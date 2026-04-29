import { Heart, PawPrint } from "lucide-react";
import { CatMascot } from "@/components/CatMascot";
import { PawPalsLogo } from "@/components/PawPalsLogo";
import { PrimaryButton } from "@/components/PrimaryButton";

export default function OnboardingPage() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-paw-radial">
      <div className="relative mx-auto min-h-screen w-full max-w-[284px] px-0 pb-[58px] pt-[58px]">
        <PawPrint className="absolute right-[20px] top-[187px] text-paw-peach" size={24} />
        <Heart className="absolute left-[30px] top-[220px] fill-paw-rose text-paw-rose" size={28} />
        <Heart className="absolute right-[38px] top-[236px] fill-paw-rose/60 text-paw-rose/60" size={20} />

        <div className="text-center">
          <div className="flex justify-center">
            <PawPalsLogo />
          </div>
          <p className="mx-auto mt-[10px] max-w-[170px] text-[15px] font-extrabold leading-[22px] text-paw-cocoa">
            A cozy community for you and your cat
          </p>
        </div>

        <div className="relative mt-[58px]">
          <CatMascot />
          <div className="absolute -bottom-[2px] -right-[58px] h-[78px] w-[210px] rounded-t-full bg-white/45" />
        </div>

        <div className="mt-[46px] space-y-[13px]">
          <PrimaryButton
            href="/auth?mode=signup"
            className="mx-auto min-h-0 h-[46px] w-[232px] rounded-[18px] text-[14px]"
          >
            Create Account
          </PrimaryButton>
          <PrimaryButton
            href="/auth?mode=login"
            variant="secondary"
            className="mx-auto min-h-0 h-[43px] w-[232px] rounded-[18px] text-[14px]"
          >
            Log In
          </PrimaryButton>
          <PrimaryButton
            href="/home"
            variant="ghost"
            className="mx-auto min-h-0 h-[38px] w-[232px] rounded-[18px] text-[13px]"
            icon={<PawPrint size={15} />}
          >
            Continue as Guest
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
