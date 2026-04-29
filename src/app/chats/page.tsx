import { Camera, CirclePlus, Image, PawPrint } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { CatMascot } from "@/components/CatMascot";
import { chatMessages } from "@/data/mockData";

export default function ChatPage() {
  return (
    <section className="flex min-h-screen flex-col bg-paw-radial pb-28">
      <PageHeader title="Luna's Mom" subtitle="Online" backHref="/discover" action="bell" />
      <div className="flex-1 space-y-4 px-5">
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[74%] rounded-3xl px-4 py-3 ${
                message.from === "me" ? "bg-[#E8F4FF]" : "bg-white/75"
              }`}
            >
              <p className="text-sm font-bold leading-relaxed">{message.text}</p>
              <p className="mt-1 text-right text-[10px] font-bold text-paw-cocoa/55">
                {message.time}
              </p>
            </div>
          </div>
        ))}
        <CatMascot compact />
      </div>
      <div className="fixed bottom-[76px] left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 bg-paw-cream/80 px-4 py-3 backdrop-blur md:bottom-[100px]">
        <div className="flex items-center gap-2">
          <button className="grid h-11 w-11 place-items-center rounded-full bg-white/70" type="button">
            <CirclePlus size={20} />
          </button>
          <label className="paw-input flex h-11 flex-1 items-center rounded-2xl px-4">
            <input
              placeholder="Type a message..."
              className="w-full bg-transparent text-sm font-bold outline-none"
            />
          </label>
          <button className="grid h-11 w-11 place-items-center rounded-full bg-paw-pink text-white shadow-soft" type="button">
            <PawPrint size={20} />
          </button>
        </div>
        <div className="mt-2 flex gap-4 pl-14 text-paw-cocoa">
          <Camera size={17} />
          <Image size={17} />
        </div>
      </div>
      <BottomNav />
    </section>
  );
}
