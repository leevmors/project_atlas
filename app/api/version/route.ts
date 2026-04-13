import { NextResponse } from 'next/server';

// This value changes on every build/deploy
const BUILD_VERSION = process.env.BUILD_ID || Date.now().toString();

export async function GET() {
  return NextResponse.json(
    { version: BUILD_VERSION },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
