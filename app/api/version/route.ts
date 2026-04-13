import { NextResponse } from 'next/server';

// This value is set once when the server starts (on deploy).
// It stays the same for the lifetime of the process.
// When a new deploy happens, the process restarts and gets a new value.
const BUILD_VERSION = process.env.BUILD_ID || String(Date.now());

export async function GET() {
  return NextResponse.json(
    { version: BUILD_VERSION },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
