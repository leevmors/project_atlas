export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      console.warn(
        '[Atlas] WARNING: ADMIN_USERNAME or ADMIN_PASSWORD environment variables are not set. ' +
        'Admin login will return 503 until these are configured.'
      );
    }
  }
}
