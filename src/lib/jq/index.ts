// @ts-ignore
import Aioli from "@biowasm/aioli";

let CLI: unknown = null;

/**
 * Initializes the jq CLI.
 */
export async function init() {
  CLI = await new Aioli(
    [
      {
        tool: "jq",
        version: "1.7",
        urlPrefix: `${window.location.origin}/jq/1.7`,
      },
    ],
    {
      printInterleaved: false,
    },
  );
  console.log("load jq success.");
}

/**
 * Runs a jq filter on a string.
 * @param text - The string to filter.
 * @param filter - The jq filter.
 * @returns The output and error of the jq command.
 */
export async function jq(text: string, filter: string): Promise<{ output: string; error: string }> {
  if (!CLI) {
    await init();
  }

  // @ts-ignore
  const paths: string[] = await CLI.mount([
    {
      name: "text.txt",
      data: text,
    },
  ]);

  const args = ["--monochrome-output", "--compact-output", filter].concat(paths);
  // @ts-ignore
  const { stdout, stderr } = await CLI.exec("jq", args);
  return { output: await stdout, error: stderr };
}
