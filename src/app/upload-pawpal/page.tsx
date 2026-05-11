"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ImagePlus, MapPin, PawPrint, Plus, Search, Sparkles, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { StatusToast } from "@/components/StatusToast";
import { apiFetch, requireSignedIn, type ApiCat } from "@/lib/api-client";

const malaysiaLocations = [
  "Johor",
  "Batu Pahat, Johor",
  "Iskandar Puteri, Johor",
  "Johor Bahru, Johor",
  "Kluang, Johor",
  "Kota Tinggi, Johor",
  "Kulai, Johor",
  "Mersing, Johor",
  "Muar, Johor",
  "Pontian, Johor",
  "Segamat, Johor",
  "Tangkak, Johor",
  "Kedah",
  "Alor Setar, Kedah",
  "Baling, Kedah",
  "Jitra, Kedah",
  "Kulim, Kedah",
  "Langkawi, Kedah",
  "Sungai Petani, Kedah",
  "Kelantan",
  "Bachok, Kelantan",
  "Gua Musang, Kelantan",
  "Kota Bharu, Kelantan",
  "Kuala Krai, Kelantan",
  "Pasir Mas, Kelantan",
  "Tanah Merah, Kelantan",
  "Melaka",
  "Ayer Keroh, Melaka",
  "Jasin, Melaka",
  "Melaka City, Melaka",
  "Masjid Tanah, Melaka",
  "Negeri Sembilan",
  "Nilai, Negeri Sembilan",
  "Port Dickson, Negeri Sembilan",
  "Seremban, Negeri Sembilan",
  "Tampin, Negeri Sembilan",
  "Pahang",
  "Bentong, Pahang",
  "Cameron Highlands, Pahang",
  "Kuantan, Pahang",
  "Mentakab, Pahang",
  "Pekan, Pahang",
  "Raub, Pahang",
  "Temerloh, Pahang",
  "Perak",
  "Batu Gajah, Perak",
  "Ipoh, Perak",
  "Kampar, Perak",
  "Kuala Kangsar, Perak",
  "Lumut, Perak",
  "Manjung, Perak",
  "Sitiawan, Perak",
  "Taiping, Perak",
  "Tapah, Perak",
  "Teluk Intan, Perak",
  "Perlis",
  "Arau, Perlis",
  "Kangar, Perlis",
  "Kuala Perlis, Perlis",
  "Penang",
  "Air Itam, Penang",
  "Balik Pulau, Penang",
  "Bayan Lepas, Penang",
  "Bukit Mertajam, Penang",
  "Butterworth, Penang",
  "George Town, Penang",
  "Nibong Tebal, Penang",
  "Perai, Penang",
  "Seberang Jaya, Penang",
  "Sabah",
  "Keningau, Sabah",
  "Kota Belud, Sabah",
  "Kota Kinabalu, Sabah",
  "Kudat, Sabah",
  "Lahad Datu, Sabah",
  "Papar, Sabah",
  "Penampang, Sabah",
  "Ranau, Sabah",
  "Sandakan, Sabah",
  "Semporna, Sabah",
  "Tawau, Sabah",
  "Sarawak",
  "Bintulu, Sarawak",
  "Kapit, Sarawak",
  "Kuching, Sarawak",
  "Limbang, Sarawak",
  "Miri, Sarawak",
  "Mukah, Sarawak",
  "Samarahan, Sarawak",
  "Sarikei, Sarawak",
  "Sibu, Sarawak",
  "Sri Aman, Sarawak",
  "Selangor",
  "Ampang, Selangor",
  "Bangi, Selangor",
  "Cheras, Selangor",
  "Cyberjaya, Selangor",
  "Kajang, Selangor",
  "Klang, Selangor",
  "Kota Damansara, Selangor",
  "Puchong, Selangor",
  "Rawang, Selangor",
  "Sepang, Selangor",
  "Seri Kembangan, Selangor",
  "Shah Alam, Selangor",
  "Subang Jaya, Selangor",
  "Sungai Buloh, Selangor",
  "Terengganu",
  "Dungun, Terengganu",
  "Kemaman, Terengganu",
  "Kuala Terengganu, Terengganu",
  "Marang, Terengganu",
  "Kuala Lumpur",
  "Bangsar, Kuala Lumpur",
  "Bukit Bintang, Kuala Lumpur",
  "Cheras, Kuala Lumpur",
  "Kepong, Kuala Lumpur",
  "Mont Kiara, Kuala Lumpur",
  "Setapak, Kuala Lumpur",
  "Taman Melawati, Kuala Lumpur",
  "Wangsa Maju, Kuala Lumpur",
  "Putrajaya",
  "Cyberjaya, Putrajaya",
  "Labuan",
  "Victoria, Labuan"
];
const personalityOptions = ["Friendly", "Calm", "Playful", "Curious", "Gentle", "Shy", "Social", "Independent"];
const lookingForOptions = ["Playdate", "Cat Friends", "Adoption", "Breeding", "Walk Buddy"];

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export default function UploadPawPalPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "UNKNOWN">("UNKNOWN");
  const [breed, setBreed] = useState("");
  const [city, setCity] = useState("Kuala Lumpur");
  const [locationSearch, setLocationSearch] = useState("Kuala Lumpur");
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const [description, setDescription] = useState("");
  const [personalityTags, setPersonalityTags] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>(["Playdate"]);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  const filteredLocations = useMemo(() => {
    const normalized = locationSearch.trim().toLowerCase();
    if (!normalized) return malaysiaLocations.slice(0, 30);
    return malaysiaLocations
      .filter((location) => location.toLowerCase().includes(normalized))
      .slice(0, 40);
  }, [locationSearch]);

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    setFiles((current) => [...current, ...selected].slice(0, 6));
    event.target.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    try {
      requireSignedIn();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Please log in to upload a PawPal.");
      return;
    }

    const totalAgeMonths = Number(ageYears || 0) * 12 + Number(ageMonths || 0);
    const selectedLocation = locationSearch.trim() || city;
    if (!name.trim() || !breed.trim()) {
      setStatus("Pet name and breed are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await apiFetch<{ cat: ApiCat }>("/api/cats", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          ageMonths: totalAgeMonths,
          gender,
          breed: breed.trim(),
          city: selectedLocation,
          description: description.trim() || null,
          personalityTags,
          lookingFor
        })
      });

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        await apiFetch(`/api/cats/${created.cat.id}/photos`, { method: "POST", body: formData });
      }

      setStatus("PawPal profile uploaded.");
      router.push(`/cats/${created.cat.id}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not upload PawPal profile.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="min-h-screen bg-[#fff6ed] px-5 pb-28 pt-5 text-paw-ink">
      <StatusToast message={status} onDismiss={() => setStatus("")} />
      <header className="mb-5 flex items-center justify-between">
        <Link href="/discover" className="grid h-11 w-11 place-items-center rounded-full bg-white text-paw-pink shadow-soft" aria-label="Back to Discover">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-xl font-black">
          Upload PawPal <PawPrint className="inline h-5 w-5 fill-paw-pink/25 text-paw-pink" />
        </h1>
        <span className="h-11 w-11" />
      </header>

      <form onSubmit={submit} className="space-y-5">
        <section className="rounded-[28px] bg-white/88 p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Pet images</h2>
              <p className="text-xs font-bold text-paw-cocoa/65">Upload up to 6 real photos.</p>
            </div>
            <label className="grid h-12 w-12 cursor-pointer place-items-center rounded-2xl bg-paw-pink text-white shadow-soft">
              <ImagePlus size={22} />
              <input type="file" accept="image/*" multiple className="hidden" onChange={selectFiles} />
            </label>
          </div>
          {previews.length ? (
            <div className="grid grid-cols-3 gap-3">
              {previews.map((preview, index) => (
                <div key={`${preview.file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-2xl bg-paw-blush">
                  <img src={preview.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-paw-pink"
                    aria-label="Remove image"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <label className="grid min-h-40 cursor-pointer place-items-center rounded-[24px] border-2 border-dashed border-paw-pink/25 bg-paw-blush/35 p-5 text-center">
              <span>
                <Plus className="mx-auto h-10 w-10 text-paw-pink" />
                <span className="mt-2 block text-sm font-black text-paw-cocoa">Select pet images</span>
              </span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={selectFiles} />
            </label>
          )}
        </section>

        <section className="grid gap-4 rounded-[28px] bg-white/88 p-5 shadow-soft">
          <input className="paw-input h-12 rounded-2xl px-4 text-sm font-bold" value={name} onChange={(event) => setName(event.target.value)} placeholder="Pet name" />
          <div className="grid grid-cols-2 gap-3">
            <input className="paw-input h-12 rounded-2xl px-4 text-sm font-bold" value={ageYears} onChange={(event) => setAgeYears(event.target.value)} type="number" min="0" max="30" placeholder="Enter year" />
            <input className="paw-input h-12 rounded-2xl px-4 text-sm font-bold" value={ageMonths} onChange={(event) => setAgeMonths(event.target.value)} type="number" min="0" max="11" placeholder="Enter month" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["UNKNOWN", "Unknown"],
              ["FEMALE", "Female"],
              ["MALE", "Male"]
            ].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setGender(value as typeof gender)} className={`h-11 rounded-2xl text-xs font-black shadow-soft ${gender === value ? "bg-paw-pink text-white" : "bg-paw-blush/50 text-paw-cocoa"}`}>
                {label}
              </button>
            ))}
          </div>
          <input className="paw-input h-12 rounded-2xl px-4 text-sm font-bold" value={breed} onChange={(event) => setBreed(event.target.value)} placeholder="Breed" />
          <div className="relative">
            <label className="flex h-12 items-center gap-2 rounded-2xl bg-white px-4 shadow-soft">
              <MapPin size={18} className="shrink-0 text-paw-pink" />
              <input
                value={locationSearch}
                onChange={(event) => {
                  setLocationSearch(event.target.value);
                  setShowLocationOptions(true);
                }}
                onFocus={() => setShowLocationOptions(true)}
                className="min-w-0 flex-1 bg-transparent text-sm font-black text-paw-cocoa outline-none placeholder:text-paw-cocoa/45"
                placeholder="Search location in Malaysia"
                role="combobox"
                aria-expanded={showLocationOptions}
                aria-controls="malaysia-location-options"
              />
              <button
                type="button"
                onClick={() => setShowLocationOptions((current) => !current)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-paw-cocoa"
                aria-label="Show Malaysia locations"
              >
                <ChevronDown size={18} />
              </button>
            </label>
            {showLocationOptions ? (
              <div
                id="malaysia-location-options"
                className="absolute left-0 right-0 top-14 z-30 max-h-72 overflow-y-auto rounded-[22px] border border-paw-peach/70 bg-white p-2 shadow-[0_18px_34px_rgba(122,81,63,0.16)]"
              >
                <div className="sticky top-0 mb-2 flex items-center gap-2 rounded-2xl bg-paw-blush/45 px-3 py-2 text-paw-cocoa">
                  <Search size={15} className="shrink-0 text-paw-pink" />
                  <span className="text-xs font-black">
                    {filteredLocations.length ? `${filteredLocations.length} locations found` : "No locations found"}
                  </span>
                </div>
                {filteredLocations.map((location) => (
                  <button
                    key={location}
                    type="button"
                    onClick={() => {
                      setCity(location);
                      setLocationSearch(location);
                      setShowLocationOptions(false);
                    }}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-2xl px-3 text-left text-sm font-black ${
                      city === location ? "bg-paw-pink text-white" : "text-paw-cocoa hover:bg-paw-blush/50"
                    }`}
                  >
                    <MapPin size={15} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{location}</span>
                  </button>
                ))}
                {!filteredLocations.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      const customLocation = locationSearch.trim();
                      if (!customLocation) return;
                      setCity(customLocation);
                      setShowLocationOptions(false);
                    }}
                    className="flex min-h-11 w-full items-center gap-2 rounded-2xl px-3 text-left text-sm font-black text-paw-cocoa hover:bg-paw-blush/50"
                  >
                    <Plus size={15} className="shrink-0 text-paw-pink" />
                    Use "{locationSearch.trim()}"
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          <textarea className="paw-input min-h-28 rounded-2xl px-4 py-3 text-sm font-bold" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={600} placeholder="Description / Bio" />
        </section>

        <section className="space-y-4 rounded-[28px] bg-white/88 p-5 shadow-soft">
          <div>
            <p className="mb-3 text-xs font-black uppercase text-paw-cocoa/65">Personality</p>
            <div className="flex flex-wrap gap-2">
              {personalityOptions.map((item) => (
                <button key={item} type="button" onClick={() => setPersonalityTags((current) => toggleValue(current, item))} className={`rounded-2xl px-4 py-2 text-xs font-black shadow-soft ${personalityTags.includes(item) ? "bg-paw-pink text-white" : "bg-paw-blush/50 text-paw-cocoa"}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-black uppercase text-paw-cocoa/65">Looking for</p>
            <div className="flex flex-wrap gap-2">
              {lookingForOptions.map((item) => (
                <button key={item} type="button" onClick={() => setLookingFor((current) => toggleValue(current, item))} className={`rounded-2xl px-4 py-2 text-xs font-black shadow-soft ${lookingFor.includes(item) ? "bg-paw-pink text-white" : "bg-paw-blush/50 text-paw-cocoa"}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <button type="submit" disabled={isSubmitting} className="flex h-14 w-full items-center justify-center gap-2 rounded-[22px] bg-paw-pink text-base font-black text-white shadow-[0_16px_32px_rgba(247,101,137,0.32)] disabled:opacity-65">
          {isSubmitting ? "Uploading..." : "Upload PawPal"}
          <Sparkles size={18} className="fill-white/30" />
        </button>
      </form>
      <BottomNav />
    </section>
  );
}
