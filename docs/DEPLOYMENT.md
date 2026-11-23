# Deploying the web app

Two environments, one per branch:

| Branch    | Environment | Hosting                         | API it talks to                   |
|-----------|-------------|---------------------------------|-----------------------------------|
| `develop` | Development | Vercel                          | Render (dev API)                  |
| `main`    | Production  | AWS S3 + CloudFront             | Contabo VPS (`api.zuristudios.com`) |

Every push runs **CI** (`.github/workflows/ci.yml`: lint, typecheck, build). Only
when CI passes does the matching deploy workflow run.

## 1. Development: Vercel (recreated)

1. Delete the old Vercel project, then **Add New → Project**, import this repo.
2. Framework: Vite. Build command `npm run build`, output `dist`. Leave the
   rest default; `vercel.json` already sets the SPA rewrite and security headers.
3. **Settings → Git → Production Branch:** `develop`.
4. **Settings → Git → Ignored Build Step:** `exit 0`. This stops Vercel
   deploying on its own, so only the GitHub workflow deploys (after CI passes).
5. **Settings → Environment Variables (Production):**
   `VITE_API_URL=https://<your-render-service>.onrender.com/api` and
   `VITE_ROOT_DOMAIN=<dev domain>` (for example `dev.zuristudios.com`).
6. Add the dev domain: `dev.zuristudios.com` and the wildcard
   `*.dev.zuristudios.com` (studio subdomains). Wildcards need the domain's
   nameservers on Vercel.
7. Create a token (**Account Settings → Tokens**) and find the IDs with
   `npx vercel link` locally (`.vercel/project.json`).
8. In GitHub, create an environment called **development** with secrets
   `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

## 2. Production: S3 + CloudFront

All in the AWS console unless noted.

1. **S3 bucket** (for example `zuri-web-prod`, region `eu-central-1`): keep
   **Block all public access** on. CloudFront reads it privately.
2. **Certificate (ACM), in `us-east-1`** (CloudFront only uses that region):
   request one for `zuristudios.com` and `*.zuristudios.com`, validate by DNS.
3. **CloudFront distribution:**
   - Origin: the bucket, with **Origin access control** (let it update the
     bucket policy).
   - Alternate domain names: `zuristudios.com`, `www.zuristudios.com`,
     `*.zuristudios.com`; certificate from step 2.
   - Default root object: `index.html`.
   - Viewer protocol: redirect HTTP to HTTPS. Compression on.
   - **Function:** CloudFront → Functions → create, paste
     `deploy/cloudfront-spa-router.js`, publish, and attach it to the default
     behaviour as *Viewer request*. (Don't use custom error pages for the SPA;
     the function keeps real 404s for missing files.)
   - **Response headers policy:** create one from
     `deploy/cloudfront-response-headers-policy.json` (same CSP and security
     headers as Vercel) and attach it to the default behaviour.
4. **DNS:** point `zuristudios.com`, `www` and `*` at the distribution (an
   alias/CNAME to `dxxxx.cloudfront.net`), and `api.zuristudios.com` at the VPS IP.
5. **GitHub → AWS sign-in without keys (OIDC):**
   - IAM → Identity providers → add `token.actions.githubusercontent.com`,
     audience `sts.amazonaws.com`.
   - IAM role trusted by that provider, limited to this repo's `main` branch
     (`repo:<owner>/els-booking-bloom:environment:production`), with a policy
     allowing `s3:ListBucket`, `s3:PutObject`, `s3:DeleteObject` on the bucket
     and `cloudfront:CreateInvalidation` on the distribution.
6. GitHub environment **production**:
   - secret `AWS_DEPLOY_ROLE_ARN`
   - variables `AWS_REGION`, `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`,
     `VITE_API_URL=https://api.zuristudios.com/api`,
     `VITE_ROOT_DOMAIN=zuristudios.com`
   - add yourself as a required reviewer if you want to approve each release.

The workflow uploads hashed assets with a one-year cache and `index.html`
with `no-cache`, then refreshes CloudFront, so a release is live within a
minute and users never get a stale app.

## 3. Branches

Create `develop` from the current work and protect `main` (pull requests
only, CI must pass). Day to day: merge into `develop` to test on the dev
site, then open `develop → main` to release.

## Why this setup

- **Vercel for dev** keeps preview-style speed and costs nothing extra.
- **S3 + CloudFront for prod** is cheap at any traffic, serves every studio
  subdomain from one bucket with one wildcard certificate, and sits next to
  your EU API.
- **Deploys only after CI** means a broken build never reaches either site.
