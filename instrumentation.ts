export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (!process.env.ADMIN_PASSWORD) {
      console.warn(
        '[Atlas] WARNING: ADMIN_PASSWORD environment variable is not set. ' +
        'Admin login will return 503 until ADMIN_PASSWORD is configured. ' +
        'Admin username defaults to "leev" if ADMIN_USERNAME is not set.'
      );
    }
  }
}
