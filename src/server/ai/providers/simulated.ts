import "server-only";
import { APP_TYPES, DECISION_IDS, type AppType, type TraitId } from "@/domain/taxonomy";
import { AiError, type AiProvider, type StructuredRequest, type StructuredResponse } from "../types";

/**
 * DEVELOPMENT MODE ONLY. A keyword-rule stand-in for the X-Ray classifier, so the full journey
 * runs without an API key. Results are stored with mode "simulated" and the UI labels them
 * as simulated on every surface. Never present this as AI analysis.
 *
 * Production refuses this provider unless ALLOW_SIMULATED_AI=true (see env.ts).
 */

const TRAIT_RULES: Record<TraitId, RegExp> = {
  hasAccounts: /\b(sign ?-?up|log ?-?in|sign ?-?in|accounts?|user profiles?|register|members?|auth\w*)\b/i,
  storesPersonalData: /\b(customers?|users?|profiles?|address(es)?|phone|e-?mails?|messages?|patients?|students?|members?|orders?|bookings?)\b/i,
  takesPayments: /\b(pay|payments?|checkout|stripe|paypal|paddle|subscriptions?|billing|purchases?|cart)\b/i,
  hasServerData: /\b(save|stores?|database|orders?|bookings?|accounts?|dashboard|admin|inventory|track|history|posts?|comments?|cart|uploads?|sign ?-?up|log ?-?in)\b/i,
  isPublic: /./, // inverted below: public unless the prompt says otherwise
  callsAiModels: /\b(ai|gpt|openai|claude|llm|chat ?bot|gemini|generate (text|images?))\b/i,
  acceptsUploads: /\b(uploads?|photos?|images?|attachments?|avatars?)\b/i,
};
const PRIVATE_USE = /\b(personal tool|just for me|only (for )?me|my own use|internal only)\b/i;

const APP_TYPE_RULES: [AppType, RegExp][] = [
  ["marketplace", /\b(marketplace|buyers and sellers|vendors)\b/i],
  ["online-shop", /\b(shop|store|e-?commerce|products?|cart)\b/i],
  ["booking", /\b(book(ing)?s?|appointments?|reservations?|schedul\w*)\b/i],
  ["ai-app", /\b(ai|gpt|llm|chat ?bot)\b/i],
  ["community", /\b(community|social|forum|chat|followers?)\b/i],
  ["saas-dashboard", /\b(saas|dashboard|analytics|crm)\b/i],
  ["internal-tool", /\b(internal|inventory|admin tool|back ?office)\b/i],
  ["content-site", /\b(blog|articles?|news|content site)\b/i],
  ["game", /\bgames?\b/i],
  ["portfolio", /\b(portfolio|landing page|personal (site|website))\b/i],
  ["mobile-app", /\b(ios|android|mobile app)\b/i],
];
const SOFTWARE = /\b(build|make|create|develop|app|website|site|tool|platform|shop|store|dashboard|bot|game|page|system)\b/i;

/** [addressed, partial] patterns per decision. Deliberately simple: this is a demo stand-in. */
const DECISION_RULES: Record<string, [RegExp, RegExp]> = {
  "ps-audience": [/\b(for (small|busy|local|independent) \w+|primary users?|target (users|audience)|so that \w+ can)\b/i, /\b(customers?|users?|people|clients?)\b/i],
  "ps-scope-v1": [/\b(out of scope|not (include|needed)|(v1|mvp|first version) (only|includes)|later version|phase 2)\b/i, /\b(features?|mvp|v1|first version)\b/i],
  "ps-success": [/\b(acceptance criteria|success (metrics?|criteria)|done when)\b/i, /\b(professional|modern|beautiful|perfect)\b/i],
  "pl-spec-file": [/\b(spec(\.md)?|agents\.md|claude\.md|requirements doc\w*|prd|cursor ?rules)\b/i, /\bplan (it )?(first|before)\b/i],
  "pl-task-breakdown": [/\b(small steps|one (feature|step) at a time)\b/i, /\b(step by step|phases?|milestones?)\b/i],
  "pl-ask-first": [/\b(ask (me )?(before|clarifying|questions)|list (your |any )?assumptions)\b/i, /\bbest practices?\b/i],
  "gw-version-control": [/\b(git|github|gitlab|commits?|version control|repo(sitory)?)\b/i, /\b(save versions|backups? of (the )?code)\b/i],
  "gw-review": [/\b(pull requests?|code review|branch(es)?|ci)\b/i, /\btest(s|ing)?\b/i],
  "gw-environments": [/\b(staging|preview environment|dev(elopment)? environment|sandbox)\b/i, /\b(test locally|localhost)\b/i],
  "fe-platform": [/\b(web ?app|website|responsive|ios|android|pwa|desktop app|mobile web)\b/i, /\b(app|mobile|phone)\b/i],
  "fe-stack": [/\b(react|next\.?js|vue|svelte|angular|flutter|react native|tailwind|lovable|bolt|v0|shadcn)\b/i, /\b(modern|clean|sleek|beautiful) (ui|design|look)\b/i],
  "fe-accessibility": [/\b(accessib\w*|wcag|screen readers?|a11y|keyboard)\b/i, /\b(mobile[- ]friendly|lightweight)\b/i],
  "be-backend-choice": [/\b(supabase|firebase|express|fastapi|django|rails|serverless|edge functions?|convex|appwrite|pocketbase)\b/i, /\b(back ?-?end|server|api)\b/i],
  "be-validation": [/\b(validat(e|ion)|zod|schema|sanitiz\w*)\b/i, /\b(form checks?|required fields?)\b/i],
  "be-errors": [/\b(error (messages?|handling|states?)|fallback|retr(y|ies))\b/i, /\bhandle errors?\b/i],
  "da-database": [/\b(postgres(ql)?|mysql|mongo(db)?|sqlite|supabase|firestore|firebase|dynamodb|neon|planetscale)\b/i, /\b(database|db|store|save|saved)\b/i],
  "da-model": [/\b(tables?|entities|schema|fields?|relationships?|foreign keys?)\b/i, /\b(orders?|products?|bookings?|posts?)\b/i],
  "da-migrations": [/\bmigrations?\b/i, /\bchange (the )?(tables?|database)\b/i],
  "ia-login": [/\b(google (sign[- ]?in|login|oauth)|magic links?|oauth|clerk|auth0|supabase auth|firebase auth|passkeys?|otp)\b/i, /\b(sign ?-?up|log ?-?in|sign ?-?in|accounts?)\b/i],
  "ia-row-access": [/\b(row[- ]level security|rls|only (see|access|view) (their|his|her) own|ownership checks?)\b/i, /\b(private|privacy|their (orders|data|profile))\b/i],
  "ia-roles": [/\b(roles?|permissions?|rbac)\b/i, /\b(admins?|staff|moderators?)\b/i],
  "ss-secrets": [/\b(env(ironment)? variables?|\.env|secrets? manager)\b/i, /\b(api keys?|stripe|openai|keys?)\b/i],
  "ss-abuse": [/\b(rate[- ]limit\w*|captcha|turnstile|bot protection|throttl\w*)\b/i, /\b(spam|security)\b/i],
  "ss-privacy": [/\b(gdpr|privacy (policy|notice)|delete (their|my|your) (account|data)|data export)\b/i, /\b(privacy|private)\b/i],
  "dc-hosting": [/\b(vercel|netlify|aws|render|fly\.io|railway|heroku|digitalocean|cloudflare|vps|azure|google cloud)\b/i, /\b(host(ed|ing)?|deploy(ed)?|online|live)\b/i],
  "dc-deploy-pipeline": [/\b(ci\/cd|github actions|auto(matic)?[- ]?deploy\w*|pipeline)\b/i, /\bdeploy\w*\b/i],
  "dc-domain": [/\b(https|ssl|custom domain)\b/i, /\b(domain|url)\b/i],
  "ro-backups": [/\b(backups?|point[- ]in[- ]time|restore)\b/i, /\b(safely stored|never lose)\b/i],
  "ro-error-tracking": [/\b(sentry|monitoring|alerts?|uptime|error tracking)\b/i, /\b(logs?|analytics)\b/i],
  "ro-logging": [/\b(structured logs?|request ids?|audit logs?|logging)\b/i, /\blogs?\b/i],
  "sp-traffic-spike": [/\b(cach(e|ing)|cdn|load[- ]test\w*|autoscal\w*)\b/i, /\b(scalable|fast|performance|viral)\b/i],
  "sp-media": [/\b(s3|r2|cloudinary|object storage|supabase storage|file size limit)\b/i, /\b(uploads?|images?|photos?|files?)\b/i],
  "sp-slow-work": [/\b(background (jobs?|workers?|tasks?)|queues?|cron)\b/i, /\b(e-?mails?|notifications?|reports?)\b/i],
  "cb-monthly-cost": [/\b(budget|cost estimate|spending limit|per month)\b/i, /\b(cheap|free|low[- ]cost|affordable)\b/i],
  "cb-payments": [/\bwebhooks?\b/i, /\b(stripe|paypal|paddle|lemon ?squeezy|pay|payments?|checkout)\b/i],
  "cb-ai-costs": [/\b(quota|spending cap|usage limits?|per[- ]user limits?)\b/i, /\b(ai|gpt|openai|claude|llm|chat ?bot)\b/i],
};

export function simulateClassification(prompt: string) {
  const traits = Object.fromEntries(
    (Object.keys(TRAIT_RULES) as TraitId[]).map((t) => [t, t === "isPublic" ? !PRIVATE_USE.test(prompt) : TRAIT_RULES[t].test(prompt)]),
  ) as Record<TraitId, boolean>;
  if (traits.hasAccounts || traits.takesPayments) traits.hasServerData = true;

  const appType = (APP_TYPE_RULES.find(([, re]) => re.test(prompt))?.[0] ?? "other") as (typeof APP_TYPES)[number];
  const isSoftwareRequest = SOFTWARE.test(prompt);

  const decisions = DECISION_IDS.map((id) => {
    const [addressed, partial] = DECISION_RULES[id] ?? [/$^/, /$^/];
    const status = addressed.test(prompt) ? "addressed" : partial.test(prompt) ? "partial" : "missing";
    return { id, status };
  });

  return { isSoftwareRequest, language: "und", appType: isSoftwareRequest ? appType : "unclear", traits, decisions };
}

export function createSimulatedProvider(): AiProvider {
  return {
    name: "simulated",
    async generate(req: StructuredRequest): Promise<StructuredResponse> {
      if (req.feature !== "xray.classify") {
        throw new AiError("provider_error", `The simulated provider has no simulation for feature "${req.feature}".`);
      }
      const prompt = (req.input as { prompt?: unknown })?.prompt;
      if (typeof prompt !== "string") throw new AiError("provider_error", "Simulated X-Ray needs a prompt.");
      return { json: simulateClassification(prompt), usage: { inputTokens: 0, outputTokens: 0 }, model: "simulated-keyword-rules" };
    },
  };
}
