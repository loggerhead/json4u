import FAQ from "@/containers/landing/FAQ";
import Features from "@/containers/landing/Features";
import HeroCarousel from "@/containers/landing/HeroCarousel";
import HeroTitle from "@/containers/landing/HeroTitle";
import { Pricing } from "@/containers/pricing";

export default function Index() {
  return (
    <div className="flex flex-col items-center w-full h-full pt-12 pb-36 px-32 gap-24 text-center">
      <HeroTitle />
      <HeroCarousel />
      <Features />
      <Pricing />
      <FAQ />
    </div>
  );
}
