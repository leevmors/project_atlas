const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { test } = require('node:test');

const routeSource = readFileSync('app/api/version/route.ts', 'utf8');
const componentSource = readFileSync('components/version-check.tsx', 'utf8');
const resolverPath = 'lib/deployment-version.ts';
const resolverSource = existsSync(resolverPath) ? readFileSync(resolverPath, 'utf8') : '';

test('version route does not generate time-based versions', () => {
  assert.doesNotMatch(routeSource, /Date\.now\(\)/);
  assert.doesNotMatch(routeSource, /String\(Date\.now\(\)\)/);
});

test('version route returns explicit enabled state from deployment resolver', () => {
  assert.match(routeSource, /getDeploymentVersion/);
  assert.match(routeSource, /enabled/);
  assert.match(routeSource, /version/);
});

test('deployment version resolver uses stable deployment and git environment variables', () => {
  assert.match(resolverSource, /BUILD_ID/);
  assert.match(resolverSource, /VERCEL_DEPLOYMENT_ID/);
  assert.match(resolverSource, /VERCEL_GIT_COMMIT_SHA/);
  assert.match(resolverSource, /NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA/);
  assert.match(resolverSource, /APP_VERSION/);
  assert.match(resolverSource, /COMMIT_SHA/);
  assert.match(resolverSource, /enabled:\s*false/);
  assert.match(resolverSource, /version:\s*null/);
});

test('version checker ignores disabled or missing versions before comparing', () => {
  assert.match(componentSource, /type\s+VersionPayload/);
  assert.match(componentSource, /enabled:\s*boolean/);
  assert.match(componentSource, /if\s*\(\s*!data\.enabled\s*\|\|\s*!data\.version\s*\)/);
  assert.match(componentSource, /initialVersion\.current\s*=\s*data\.version/);
});
