import Link from "next/link";
import { ChevronRight, Heart, PawPrint, Sparkles } from "lucide-react";
import { GuestContinueButton } from "@/components/GuestContinueButton";
import homepageImage from "../../images/homepage.png";
import logoImage from "../../images/logo1.png";
import loadingBg from "../../images/loadingBg.png";

export default function OnboardingPage() {
  return (
    <section
      className="relative h-[100dvh] overflow-hidden bg-[#fff7e9] bg-cover bg-center bg-no-repeat px-5 text-paw-cocoa"
      style={{ backgroundImage: `url(${loadingBg.src})` }}
    >

      <PawPrint className="absolute left-10 top-24 h-10 w-10 rotate-[-12deg] fill-paw-peach/20 text-paw-peach/20" />
      <PawPrint className="absolute right-10 top-16 h-10 w-10 rotate-12 fill-paw-peach/20 text-paw-peach/20" />
      <PawPrint className="absolute left-8 top-[40vh] h-9 w-9 rotate-6 fill-paw-peach/18 text-paw-peach/18" />
      <Heart className="absolute left-[17%] top-[39vh] h-10 w-10 rotate-[-10deg] fill-paw-pink text-paw-pink opacity-85" />
      <Heart className="absolute right-[18%] top-[42vh] h-7 w-7 rotate-[-10deg] fill-paw-rose text-paw-rose opacity-70" />
      <Sparkles className="absolute right-11 top-[48vh] h-6 w-6 fill-paw-butter text-paw-butter" />

      <div className="relative mx-auto flex h-full w-full max-w-[390px] flex-col items-center pb-[clamp(0.6rem,2vh,1.25rem)] pt-[clamp(1rem,2.5vh,2rem)]">
        <div className="text-center">
          <img
            src={logoImage.src}
            alt="PawPals"
            className="mx-auto h-[clamp(118px,23vh,168px)] w-full max-w-[390px] object-contain drop-shadow-[0_8px_14px_rgba(95,50,22,0.18)]"
          />
          <p className="mx-auto -mt-[clamp(0.35rem,1vh,0.7rem)] flex max-w-[270px] items-center justify-center gap-3 text-center text-[clamp(18px,5.4vw,22px)] font-black leading-[1.35] text-paw-cocoa">
            <Heart className="h-5 w-5 shrink-0 rotate-[-15deg] fill-paw-pink text-paw-pink" />
            <span>A cozy community for you and your cat</span>
            <Heart className="h-5 w-5 shrink-0 rotate-[15deg] fill-paw-pink text-paw-pink" />
          </p>
        </div>

        <div className="relative mt-[clamp(0.35rem,1vh,0.75rem)] flex h-[clamp(230px,36vh,285px)] w-full items-end justify-center">
          <div className="absolute bottom-0 h-[clamp(210px,32vh,260px)] w-[clamp(210px,32vh,260px)] rounded-full bg-paw-blush/60" />
          <img
            src={homepageImage.src}
            alt=""
            className="relative z-10 h-[clamp(215px,33vh,260px)] w-full max-w-[360px] object-contain drop-shadow-[0_14px_16px_rgba(122,81,63,0.12)]"
          />
          <div className="absolute -bottom-8 left-1/2 z-20 h-24 w-[118%] -translate-x-1/2 rounded-t-[50%] bg-white/86 shadow-[0_-10px_24px_rgba(255,255,255,0.82)]" />
        </div>

        <div className="relative z-30 mt-[clamp(0.75rem,2.4vh,1.5rem)] flex w-full flex-col items-center gap-[clamp(0.65rem,1.7vh,0.95rem)]">
          <Link
            href="/auth?mode=signup"
            className="inline-flex h-[clamp(56px,8vh,66px)] w-full max-w-[320px] items-center justify-center gap-3 rounded-[28px] border border-white/70 bg-gradient-to-r from-paw-pink to-paw-rose text-[clamp(20px,5.6vw,23px)] font-black text-white shadow-[0_16px_28px_rgba(247,101,137,0.32)] transition hover:brightness-105"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-paw-pink">
              <PawPrint className="h-7 w-7 fill-paw-pink/45" />
            </span>
            Create Account
            <PawPrint className="h-6 w-6 shrink-0 fill-white/20 text-white" />
          </Link>

          <Link
            href="/auth?mode=login"
            className="inline-flex h-[clamp(52px,7.5vh,62px)] w-full max-w-[320px] items-center justify-center gap-3 rounded-[28px] border-2 border-paw-cocoa/10 bg-white/76 text-[clamp(20px,5.4vw,23px)] font-black text-paw-cocoa shadow-[0_12px_24px_rgba(122,81,63,0.08)] transition hover:bg-white"
          >
            Log In
            <ChevronRight className="h-8 w-8 text-paw-pink" />
          </Link>

          <div className="flex w-full max-w-[230px] items-center justify-center gap-3">
            <span className="h-px flex-1 bg-paw-cocoa/18" />
            <span className="grid h-8 w-8 place-items-center rounded-full bg-paw-butter/50 text-[16px] font-black text-paw-cocoa">
              or
            </span>
            <span className="h-px flex-1 bg-paw-cocoa/18" />
          </div>

          <GuestContinueButton />
        </div>
      </div>
    </section>
  );
}
