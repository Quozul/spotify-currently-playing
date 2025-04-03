import {
	POSTGRES_DB,
	POSTGRES_HOST,
	POSTGRES_PASSWORD,
	POSTGRES_USER,
} from "$env/static/private";
import postgres from "postgres";

const options = {
	host: POSTGRES_HOST,
	username: POSTGRES_USER,
	password: POSTGRES_PASSWORD,
	database: POSTGRES_DB,
};
export const sql = postgres(options);
