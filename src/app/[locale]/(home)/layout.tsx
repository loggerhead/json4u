import { Inter } from "next/font/google";
import Head from "next/head";
import Script from "next/script";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className={`flex min-h-screen flex-col ${inter.className}`}>
      <Head>
        <link rel="stylesheet" href="https://cdn.sell.app/embed/style.css"></link>
      </Head>
      <Script src="https://cdn.sell.app/embed/script.js" type="module"></Script>
      <Header />
      <div className="flex flex-1 justify-center w-full">
        <div className="flex w-full max-w-[1280px] h-full">{children}</div>
      </div>
      <Footer />
    </main>
  );
}
