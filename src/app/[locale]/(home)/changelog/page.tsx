import { notFound } from "next/navigation";

export default async function HomePage({ params }: { params: { locale: string } }) {
  try {
    const Content = (await import(`./${params.locale}.mdx`)).default;
    return <Content />;
  } catch (error) {
    notFound();
  }
}
