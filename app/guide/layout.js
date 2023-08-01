import "github-markdown-css";

export default async function MdxLayout({ children }) {
  return (
    <div className="markdown-body relative w-full bg-white shadow-xl shadow-slate-700/10 ring-1 ring-gray-900/5 md:max-w-3xl md:mx-auto lg:max-w-4xl lg:pt-16 lg:pb-28">
      <div className="mt-8 prose prose-slate mx-auto lg:prose-lg">{children}</div>
    </div>
  );
}
