import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PhonePe V2 API Configuration
// V2 uses OAuth 2.0 (Client ID + Client Secret) — NOT checksum/salt key
const PHONEPE_V2_CONFIG = {
    sandbox: {
        // Token endpoint for sandbox
        tokenUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
        // Checkout pay endpoint for sandbox
        payUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay',
        // Status check endpoint for sandbox
        statusUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order',
        name: 'Sandbox (UAT)',
    },
    production: {
        // Token endpoint for production (identity-manager service)
        tokenUrl: 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
        // Checkout pay endpoint for production
        payUrl: 'https://api.phonepe.com/apis/pg/checkout/v2/pay',
        // Status check endpoint for production
        statusUrl: 'https://api.phonepe.com/apis/pg/checkout/v2/order',
        name: 'Production (LIVE)',
    },
};

/**
 * POST /api/admin/phonepe-validate
 *
 * Tests PhonePe V2 credentials (Client ID + Client Secret) by attempting
 * to get an OAuth access token. If the token request succeeds, credentials are valid.
 * Then optionally fires a test payment to confirm the full flow.
 *
 * Body: { clientId, clientSecret, clientVersion, environment }
 */
export async function POST(request) {
    try {
        const { clientId, clientSecret, clientVersion, environment } = await request.json();

        // --- Input Validation ---
        if (!clientId?.trim()) {
            return NextResponse.json({ valid: false, error: 'Client ID is required' }, { status: 400 });
        }
        if (!clientSecret?.trim()) {
            return NextResponse.json({ valid: false, error: 'Client Secret is required' }, { status: 400 });
        }
        if (!PHONEPE_V2_CONFIG[environment]) {
            return NextResponse.json({
                valid: false,
                error: 'Environment must be "sandbox" or "production"'
            }, { status: 400 });
        }

        const cleanClientId = clientId.trim();
        const cleanClientSecret = clientSecret.trim();
        const cleanClientVersion = (clientVersion || '1').toString().trim();
        const cleanEnv = environment.trim().toLowerCase();
        const config = PHONEPE_V2_CONFIG[cleanEnv];

        console.log(`[PhonePe Validate] Testing ${config.name} credentials for: ${cleanClientId}`);

        // --- Step 1: Get OAuth Token ---
        const tokenBody = new URLSearchParams({
            client_id: cleanClientId,
            client_secret: cleanClientSecret,
            client_version: cleanClientVersion,
            grant_type: 'client_credentials',
        });

        const tokenRes = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenBody.toString(),
        });

        const tokenData = await tokenRes.json();

        // Check for token success
        if (tokenData.access_token) {
            // Token obtained — credentials are definitively valid
            return NextResponse.json({
                valid: true,
                message: `✅ CREDENTIALS VALID — Successfully authenticated with PhonePe ${config.name}`,
                environment: cleanEnv,
                clientId: cleanClientId,
                tokenType: tokenData.token_type || 'Bearer',
            });
        }

        // Handle specific auth errors
        const errCode = tokenData.code || tokenData.error;
        const errMsg = tokenData.message || tokenData.error_description || JSON.stringify(tokenData);

        // API mapping not found — wrong token URL for this credential type
        if (errMsg?.toLowerCase().includes('api mapping')) {
            const otherEnv = cleanEnv === 'sandbox' ? 'production' : 'sandbox';
            const otherConfig = PHONEPE_V2_CONFIG[otherEnv];

            // Test against the opposite environment
            const otherTokenRes = await fetch(otherConfig.tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: tokenBody.toString(),
            });
            const otherTokenData = await otherTokenRes.json();

            if (otherTokenData.access_token) {
                return NextResponse.json({
                    valid: false,
                    error: '❌ ENVIRONMENT MISMATCH DETECTED',
                    details: `Your credentials work in ${otherEnv.toUpperCase()} but you selected ${cleanEnv.toUpperCase()}.`,
                    suggestion: `Switch Environment dropdown from "${cleanEnv}" to "${otherEnv}" and save.`,
                    code: 'ENVIRONMENT_MISMATCH',
                });
            }
        }

        // Bad request — invalid client credentials
        if (tokenRes.status === 400 || errCode === 'Bad Request' || errMsg?.toLowerCase().includes('bad request')) {
            return NextResponse.json({
                valid: false,
                error: '❌ INVALID CREDENTIALS',
                details: 'Client ID or Client Secret is incorrect.',
                suggestion: 'Copy fresh credentials from PhonePe Business Dashboard → Developer Settings.',
                code: errCode,
                rawMessage: errMsg,
            });
        }

        // Other token error
        return NextResponse.json({
            valid: false,
            error: `⚠️ Authentication failed`,
            details: errMsg,
            code: errCode,
        });

    } catch (error) {
        console.error('[PhonePe Validate] Crash:', error);
        return NextResponse.json({
            valid: false,
            error: 'Validator error',
            details: error.message,
        }, { status: 500 });
    }
}
