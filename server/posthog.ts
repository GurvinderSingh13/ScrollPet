import { PostHog } from "posthog-node";

const posthogClient = new PostHog(process.env.POSTHOG_API_KEY!, {
  host: process.env.POSTHOG_HOST,
});

export default posthogClient;
