import {kv} from "@vercel/kv";
import {genError, genResp} from "@/app/api/util";
import Joi from "joi";

const expireSeconds = 7 * 86400;

const schema = Joi.object({
  left: Joi.string().allow('').required(),
  right: Joi.string().allow('').required(),
  lastAction: Joi.object(),
});

// 生成分享链接
export async function POST(req) {
  let data;
  try {
    data = await req.json();
  } catch (e) {
    return genError(req, 400, `invalid json: ${e}`);
  }

  // 参数校验
  const {error} = schema.validate(data);

  if (error) {
    return genError(req, 400, `invalid arguments: ${error}`);
  } else if (data.left === '' && data.right === '') {
    return genError(req, 400, `invalid arguments: empty text`);
  }

  let id = "";

  for (let i = 0; i < 3; i++, id = "") {
    id = genID();
    try {
      if (!await kv.get(id)) {
        break;
      }
    } catch (e) {
      console.error(`kv.get failed: ${e}`);
    }
  }

  // 生成 id 失败
  if (!id) {
    return genError(req, 429, "generate id failed");
  }

  let r;

  try {
    r = await kv.set(id, data, {ex: expireSeconds});
  } catch (e) {
    console.error(`kv.set failed: ${e}`);
  }

  if (!r) {
    return genError(req, 500, "set kv failed");
  }

  return genResp(req, {id: id, ttl: expireSeconds});
}

export async function OPTIONS(req) {
  return genResp(req);
}

// 生成分享 id
function genID() {
  let seconds = Math.floor(Date.now() / 1000) % 1000000;
  let id = '';

  while (seconds > 0) {
    id += ch62(seconds % 62);
    seconds = Math.floor(seconds / 62);
  }

  for (let i = 0; i < 3; i++) {
    id += ch62(Math.random() * 62);
  }
  return id;
}

function ch62(n) {
  const chs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return chs[Math.floor(n % 62)];
}
