export interface Env {
	// vars:
	PUSHOVER_API_URL: string,
	IS_WEBHOOK_SECRET_USER_KEY?: string,
	PUSHOVER_MESSAGE_PRIORITY?: string,
	PUSHOVER_MESSAGE_TITLE?: string,

	// secrets:
	WEBHOOK_SECRET: string,
	PUSHOVER_USER_KEY: string,
	PUSHOVER_APP_TOKEN: string,
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const cfWebhookAuth = request.headers.get("cf-webhook-auth");

		function isWebhookSecretUserKey() {
			return env.IS_WEBHOOK_SECRET_USER_KEY && env.IS_WEBHOOK_SECRET_USER_KEY != '0';
		}

		if (isWebhookSecretUserKey()) {
			if (!cfWebhookAuth) {
				return new Response("Missing cf-webhook-auth", {
					headers: {'content-type': 'text/plain'},
					status: 401
				})
			}
		}
		else if (env.WEBHOOK_SECRET && cfWebhookAuth !== env.WEBHOOK_SECRET) {
			return new Response(":(", {
				headers: {'content-type': 'text/plain'},
				status: 401
			})
		}

		const webhookPayload = await request.json<{
			text: string
		}>();
		const message = webhookPayload.text ?? '<EMPTY>';

		let body: any = {
			token: env.PUSHOVER_APP_TOKEN,
			user: isWebhookSecretUserKey() ? cfWebhookAuth : env.PUSHOVER_USER_KEY,
			message: message,
		};
		if (env.PUSHOVER_MESSAGE_PRIORITY) {
			body.priority = Number(env.PUSHOVER_MESSAGE_PRIORITY);
		}
		if (env.PUSHOVER_MESSAGE_TITLE) {
			body.title = env.PUSHOVER_MESSAGE_TITLE;
		}

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
