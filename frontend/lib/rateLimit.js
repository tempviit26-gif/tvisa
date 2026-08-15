/**
 * Client-side rate limiting utility using localStorage.
 *
 * This provides a UX-layer guard on form submissions to prevent accidental
 * or intentional rapid firing before the server's 429 response kicks in.
 *
 * It tracks timestamps of recent attempts per action key and enforces
 * a sliding-window limit. It is NOT a security control by itself —
 * the backend DRF throttles are the authoritative enforcement.
 */

const STORAGE_PREFIX = 'rl_';

/**
 * Retrieve stored attempt timestamps for a given action key.
 * @param {string} key - Unique action identifier (e.g. "login", "register")
 * @returns {number[]} Array of timestamps (ms) of recent attempts
 */
function getAttempts(key) {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Persist attempt timestamps for a given action key.
 * @param {string} key
 * @param {number[]} attempts
 */
function setAttempts(key, attempts) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(attempts));
    } catch {
        // Storage quota or private mode — silently skip
    }
}

/**
 * Record a new attempt for the given action key now.
 * @param {string} key
 */
export function recordAttempt(key) {
    const attempts = getAttempts(key);
    attempts.push(Date.now());
    setAttempts(key, attempts);
}

/**
 * Check whether the action is currently rate-limited.
 *
 * @param {string} key          - Unique action identifier
 * @param {number} maxAttempts  - Maximum allowed attempts within the window
 * @param {number} windowMs     - Sliding window size in milliseconds
 * @returns {{ limited: boolean, waitSeconds: number }}
 *   - limited: true when the limit is exceeded
 *   - waitSeconds: seconds until the oldest attempt expires and the limit resets
 */
export function checkRateLimit(key, maxAttempts, windowMs) {
    const now = Date.now();
    // Prune attempts older than the window
    const attempts = getAttempts(key).filter((t) => now - t < windowMs);
    setAttempts(key, attempts);

    if (attempts.length >= maxAttempts) {
        // Oldest attempt in the window — next slot opens when it expires
        const oldest = attempts[0];
        const waitMs = windowMs - (now - oldest);
        const waitSeconds = Math.ceil(waitMs / 1000);
        return { limited: true, waitSeconds };
    }

    return { limited: false, waitSeconds: 0 };
}

/**
 * Clear all recorded attempts for a given action key.
 * Useful after a successful operation to reset the counter.
 * @param {string} key
 */
export function clearAttempts(key) {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_PREFIX + key);
}

// ─── Pre-configured limits matching backend DRF scopes ───────────────────────

/** Rate limit configs keyed by action name */
export const RATE_LIMITS = {
    login: { maxAttempts: 5, windowMs: 2 * 60 * 1000 },      // 5 per 2 minutes
    register: { maxAttempts: 5, windowMs: 2 * 60 * 1000 },    // 5 per 2 minutes
    otp_verify: { maxAttempts: 10, windowMs: 2 * 60 * 1000 }, // 10 per 2 minutes
    otp_resend: { maxAttempts: 3, windowMs: 5 * 60 * 1000 },  // 3 per 5 minutes
};

/**
 * Convenience: check and record an attempt in one call.
 * Returns { limited, waitSeconds } — call BEFORE making the API request.
 * If not limited, the attempt is automatically recorded.
 *
 * @param {keyof typeof RATE_LIMITS} action
 * @returns {{ limited: boolean, waitSeconds: number }}
 */
export function checkAndRecord(action) {
    const config = RATE_LIMITS[action];
    if (!config) return { limited: false, waitSeconds: 0 };

    const result = checkRateLimit(action, config.maxAttempts, config.windowMs);
    if (!result.limited) {
        recordAttempt(action);
    }
    return result;
}
