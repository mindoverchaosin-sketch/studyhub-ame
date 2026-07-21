// inspect-next-auth.js
try {
  const path = require('path');
  console.log('cwd', process.cwd());
  const na = require('next-auth');
  console.log('next-auth loaded:', typeof na !== 'undefined');
  try {
    const oidc = require('openid-client');
    console.log('openid-client loaded:', typeof oidc !== 'undefined');
    if (oidc) {
      console.log('openid-client keys:', Object.keys(oidc));
      console.log('openid-client.custom:', typeof oidc.custom !== 'undefined');
    }
  } catch (e) {
    console.error('failed to require openid-client:', e && e.message);
    console.error(e && e.stack);
  }
} catch (e) {
  console.error('failed to require next-auth:', e && e.message);
  console.error(e && e.stack);
  process.exit(1);
}
