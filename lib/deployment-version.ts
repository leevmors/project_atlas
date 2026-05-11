export type DeploymentVersion = {
  version: string | null;
  enabled: boolean;
};

const VERSION_ENV_KEYS = [
  'BUILD_ID',
  'VERCEL_DEPLOYMENT_ID',
  'VERCEL_GIT_COMMIT_SHA',
  'NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA',
  'APP_VERSION',
  'COMMIT_SHA',
] as const;

export function getDeploymentVersion(env: NodeJS.ProcessEnv = process.env): DeploymentVersion {
  for (const key of VERSION_ENV_KEYS) {
    const value = env[key]?.trim();
    if (value) {
      return { version: value, enabled: true };
    }
  }

  return { version: null, enabled: false };
}
