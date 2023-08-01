// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap#generate-a-sitemap
export default function sitemap() {
  return [
    {
      url: "https://json4u.com",
      lastModified: new Date(),
    },
    {
      url: "https://json4u.com/guide",
      lastModified: new Date(),
    },
  ];
}
