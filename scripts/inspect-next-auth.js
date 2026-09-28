// inspect-next-auth.js
async function main() {
  try {
    console.log('cwd', process.cwd());
    const na = await import('next-auth');
    console.log('next-auth loaded:', typeof na !== 'undefined');
    try {
      const oidc = await import('openid-client');
      console.log('openid-client loaded:', typeof oidc !== 'undefined');
      if (oidc) {
        console.log('openid-client keys:', Object.keys(oidc));
        console.log('openid-client.custom:', typeof oidc.custom !== 'undefined');
      }
    } catch (error) {
      console.error('failed to import openid-client:', error && error.message);
      console.error(error && error.stack);
    }
  } catch (error) {
    console.error('failed to import next-auth:', error && error.message);
    console.error(error && error.stack);
    process.exit(1);
  }
}

void main();
