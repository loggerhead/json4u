import { getPostData } from "@/lib/posts";

export const metadata = {};

export default async function Guide() {
  const postData = await getPostData("guide.md");
  metadata.title = postData.title;
  metadata.description = postData.description;

  return <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />;
}
