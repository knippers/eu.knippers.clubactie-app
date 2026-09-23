'use strict';

const https = require('https');

/**
 * mijn-api.clubactie.nl stuurt een Content-Security-Policy header terug die
 * over meerdere regels loopt via verouderde "line folding". Node's ingebouwde
 * fetch (undici) wijst dat resoluut af ("Missing expected CR after header
 * value"). Met de kale https-module + insecureHTTPParser komen we daar wel
 * doorheen.
 */
function request(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    if (token) headers.Authorization = `Bearer ${token}`;

    const req = https.request(
      {
        hostname: 'mijn-api.clubactie.nl',
        path,
        method,
        headers,
        insecureHTTPParser: true,
        timeout: 15000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            const err = new Error(`HTTP ${res.statusCode}: ${data}`);
            err.statusCode = res.statusCode;
            reject(err);
            return;
          }
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch (e) {
            reject(new Error(`Ongeldige JSON response: ${data}`));
          }
        });
      },
    );

    req.on('timeout', () => req.destroy(new Error('Timeout bij verbinden met Clubactie API')));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function login(sellerId, loginCode) {
  const data = await request('/api/v2/auth/login', 'POST', {
    sellerId: Number(sellerId),
    loginCode: String(loginCode),
  });
  if (!data.bearerToken) {
    throw new Error('Geen bearerToken ontvangen. Klopt sellerId/loginCode?');
  }
  return data.bearerToken;
}

async function getOverview(bearerToken) {
  return request('/api/v2/seller/environment/overview', 'GET', null, bearerToken);
}

async function fetchOverviewFor(sellerId, loginCode) {
  const token = await login(sellerId, loginCode);
  return getOverview(token);
}

module.exports = { login, getOverview, fetchOverviewFor };
