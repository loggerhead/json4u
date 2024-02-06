import {genError, genResp} from "@/app/api/util";
import {kv} from "@vercel/kv";

// 获取分享页内容
export async function GET(req, {params}) {
  const id = params.id;
  let data;

  try {
    data = await kv.get(id);
  } catch (e) {
    return genError(req, 500, `kv.get failed: ${e}`);
  }

  if (!data) {
    return genError(req, 404, "data not found");
  }

  return genResp(req, data);
}
