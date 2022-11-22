import {token, type Token} from "./store/store";

export function fetchRefreshToken(refreshToken) {
	console.log(`Refreshing token...`);
	fetch(import.meta.env.VITE_API_BASE + "refresh", {
		body: JSON.stringify({refreshToken}),
		method: "post",
		headers: {
			"content-type": "application/json",
			"accept": "application/json",
		},
	})
		.then(res => {
			if (res.ok) {
				res.json()
					.then((json: Token) => {
						const expires_at = Date.now() + json.expires_in * 1000;
						token.set({
							...json,
							expires_at,
						});
					});
			} else {
				window.location.hash = "";
			}
		});
}

export function login(code) {
	fetch(import.meta.env.VITE_API_BASE + "token", {
		method: "post",
		body: JSON.stringify({code}),
		headers: {
			"content-type": "application/json",
			"accept": "application/json",
		}
	})
		.then(res => {
			if (res.ok) {
				res.json()
					.then((json: Token) => {
						const expires_at = Date.now() + json.expires_in * 1000;
						window.location.search = "";

						token.set({
							...json,
							expires_at,
						});
					});
			} else {
				window.location.hash = "";
			}
		});
}