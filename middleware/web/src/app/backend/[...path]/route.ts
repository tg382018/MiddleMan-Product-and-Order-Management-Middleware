import { NextRequest } from 'next/server';

function upstreamBase() {
  // In docker-compose: http://middleware-api:3002
  // Local dev: http://localhost:3002
  return process.env.MIDDLEWARE_API_INTERNAL_URL ?? 'http://localhost:3002';
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const url = `${upstreamBase()}/${path.join('/')}${req.nextUrl.search}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      accept: req.headers.get('accept') ?? 'application/json',
    },
    cache: 'no-store',
  });

  return new Response(res.body, { status: res.status, headers: res.headers });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const url = `${upstreamBase()}/${path.join('/')}${req.nextUrl.search}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': req.headers.get('content-type') ?? 'application/json',
      accept: req.headers.get('accept') ?? 'application/json',
    },
    body: req.body,
    // @ts-expect-error: duplex is required by Node fetch when streaming a request body
    duplex: 'half',
    cache: 'no-store',
  });

  return new Response(res.body, { status: res.status, headers: res.headers });
}


