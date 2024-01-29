export interface Env {
	// vars:
	PUSHOVER_API_URL: string,

	// secrets:
	WEBHOOK_SECRET: string,
	PUSHOVER_USER_KEY: string,
	PUSHOVER_APP_TOKEN: string,
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

		if (env.WEBHOOK_SECRET && request.headers.get("cf-webhook-auth") !== env.WEBHOOK_SECRET) {
			return new Response(":(", {
				headers: {'content-type': 'text/plain'},
				status: 401
			})
		}

		let body: any = {
			token: env.PUSHOVER_APP_TOKEN,
			user: env.PUSHOVER_USER_KEY,
		};

		// load from search params
		// user / token can be overridden
		new URL(request.url).searchParams.forEach((v, k) => body[k] = v);

		// override message
		body.message = (await request.json<{ text: string }>()).text ?? '<EMPTY>';

		// pushover API doc: https://pushover.net/api
		try {
			const response = await fetch(env.PUSHOVER_API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			});
			console.log(`Pushover response: ${response.status} ${response.statusText}`);
		} catch (error) {
			console.log(error)
		}

		return new Response(":)", {
			headers: {'content-type': 'text/plain'},
		})
	},
};
