import {NextResponse} from 'next/server';

const commonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function genResp(req, body) {
  return newResp(req, 200, body);
}

export function genError(req, code, error) {
  return newResp(req, code, {error});
}

function newResp(req, code, body) {
  let origin = req.headers.get('Origin');

  if (!/https?:\/\/((www\.)?json4u.com|localhost:3000)/.test(origin)) {
    origin = '';
  }

  return NextResponse.json(
    body || {},
    {
      status: code,
      headers: {
        ...commonHeaders,
        'Access-Control-Allow-Origin': origin,
      },
    },
  );
}
