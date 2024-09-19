import { Inter } from "next/font/google";
import { Footer } from "@/containers/landing/Footer";
import { Header } from "@/containers/landing/Header";

const inter = Inter({ subsets: ["latin"] });

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className={`flex flex-col items-center min-h-screen ${inter.className}`}>
      <Header />
      <div className="flex flex-col flex-1 justify-center items-center w-full">
        <div className="relative flex flex-1 w-full max-w-[1280px] items-center">{children}</div>
      </div>
      <Footer />
    </main>
  );
}
