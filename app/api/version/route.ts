import { NextResponse } from 'next/server';
import { getDeploymentVersion } from '@/lib/deployment-version';

export async function GET() {
  const deploymentVersion = getDeploymentVersion();

  return NextResponse.json(
    {
      version: deploymentVersion.version,
      enabled: deploymentVersion.enabled,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
