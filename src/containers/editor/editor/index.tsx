"use client";

import dynamic from "next/dynamic";
import Loading from "@/components/Loading";

// https://github.com/suren-atoyan/monaco-loader?tab=readme-ov-file#for-nextjs-users
const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => <Loading />,
});

export default Editor;
