import MdxPage, { mdxGenMetadata } from "../../MdxPage";

export async function generateMetadata() {
  return mdxGenMetadata(__dirname);
}

export default async function Page() {
  return <MdxPage dir={__dirname} />;
}
