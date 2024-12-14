import { getLocale } from "next-intl/server";

function getRelativePath(dir: string) {
  const p = dir.split("(mdx)")[1];
  return "." + p;
}

export async function mdxGenMetadata(dir: string) {
  const locale = await getLocale();
  const mdx = await import(`${getRelativePath(dir)}/${locale}.mdx`);
  return { ...mdx.metadata };
}

export default async function MdxPage({ dir }: { dir: string }) {
  const locale = await getLocale();
  const Content = (await import(`${getRelativePath(dir)}/${locale}.mdx`)).default;
  return <Content />;
}
