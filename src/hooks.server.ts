import { sql } from "$lib/db";
import type { Handle } from "@sveltejs/kit";

(async () => {
	try {
		await sql`
        CREATE TABLE IF NOT EXISTS tokens
        (
            uuid          UUID PRIMARY KEY,
            user_id       TEXT UNIQUE,
            access_token  TEXT,
            token_type    TEXT,
            expires_in    INTEGER,
            refresh_token TEXT,
            scope         TEXT,
            created_at    TIMESTAMPTZ DEFAULT NOW()
        );
    `;
		console.log("Database migration completed");
	} catch (err) {
		console.error("Database migration failed", err);
		process.exit(1);
	}
})();

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
