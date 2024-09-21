import FAQ from "@/containers/landing/FAQ";
import Features from "@/containers/landing/Features";
import HeroCarousel from "@/containers/landing/HeroCarousel";
import HeroTitle from "@/containers/landing/HeroTitle";
import { Pricing } from "@/containers/pricing";

export default function Index() {
  return (
    <div className="relative flex flex-col items-center w-full h-full pt-12 pb-36 px-32 gap-24 text-center">
      <HeroTitle />
      <HeroCarousel />
      <Features />
      <Pricing />
      <FAQ />
      <ProductHunk />
    </div>
  );
}

function ProductHunk() {
  return (
    <a
      className="fixed bottom-0 right-0 m-4"
      href="https://www.producthunt.com/posts/json-for-you?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-json&#0045;for&#0045;you"
      target="_blank"
    >
      <img
        src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=490548&theme=light"
        alt="JSON&#0032;For&#0032;You - Fastest&#0032;JSON&#0032;visualization&#0032;and&#0032;processing&#0032;tool | Product Hunt"
        style={{ width: "250px", height: "54px" }}
        width="250"
        height="54"
      />
    </a>
  );
}
