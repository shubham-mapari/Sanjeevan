/**
 * ADMIN_BASE_PATH
 *
 * The private base path for the admin panel.
 * Change this single constant to relocate the entire admin panel.
 * Never expose this URL in public-facing pages, navbar, footer, or sitemap.
 */
export const ADMIN_BASE_PATH = "/secure-institute-management";

/** Convenience helpers */
export const ADMIN_LOGIN_PATH = `${ADMIN_BASE_PATH}/login`;
export const ADMIN_DASHBOARD_PATH = `${ADMIN_BASE_PATH}/dashboard`;
export const ADMIN_ACCESS_DENIED_PATH = `${ADMIN_BASE_PATH}/access-denied`;
