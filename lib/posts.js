import fs from "fs";
import path from "path";
import html from "remark-html";
import matter from "gray-matter";
import { remark } from "remark";

// Your markdown folder for posts.
const postsDirectory = path.join(process.cwd(), "posts");

export async function getPostData(fileName) {
  const id = fileName.replace(/\.md$/, "");
  const fullPath = path.join(postsDirectory, fileName);
  const fileContents = fs.readFileSync(fullPath, "utf8");

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents);

  // Use remark to convert markdown into HTML string
  const processedContent = await remark().use(html).process(matterResult.content);
  const contentHtml = processedContent.toString();

  // Combine the data with the id and contentHtml
  return {
    id,
    contentHtml,
    ...matterResult.data,
  };
}
