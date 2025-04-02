type PlayerUUID = {
	uuid: string;
};

export async function login(code: string) {
	const res = await fetch("/api/token", {
		method: "post",
		body: JSON.stringify({ code }),
		headers: {
			"content-type": "application/json",
			accept: "application/json",
		},
	});
	if (res.ok) {
		const json: PlayerUUID = await res.json();
		return json.uuid;
	}
	throw new Error(res.statusText);
}
