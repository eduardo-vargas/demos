# Deploying Voting Platform to Cloudflare

This guide walks you through deploying the Voting Platform to your own Cloudflare account.

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
- Node.js 18+

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Configure Cloudflare Resources

You need to create three Cloudflare resources:

### 2a. Create D1 Database

```bash
# Create the database
wrangler d1 create voting-platform

# Note the database_id from the output, then apply the schema:
wrangler d1 execute voting-platform --remote --file=schema.sql
```

### 2b. Create KV Namespace

```bash
wrangler kv:namespace create GUEST_LOGBOOK
```

Note the `id` from the output.

### 2c. (Optional) Set Up Cloudflare Access

If you want optional email authentication:

1. Go to [Cloudflare Access Applications](https://dash.cloudflare.com/access/apps)
2. Click **Add an application**
3. Select **Self-hosted**
4. Configure:
   - **Application name**: Voting Platform
   - **Session duration**: 24 hours
   - **Application domain**: Your desired domain (e.g., `voting.yourdomain.com`)
   - **Path**: `/auth` (only protect this path)
5. Under **Policy**, add allowed emails or set to "Allow" for public access
6. Note your **Application Audience (AUD)** tag

## Step 3: Configure wrangler.toml

Copy the example config and fill in your values:

```bash
cp wrangler.toml.example wrangler.toml
```

Edit `wrangler.toml`:

- Set `account_id` to your Cloudflare account ID
- Set `database_id` from step 2a
- Set KV `id` from step 2b
- If using a custom domain, uncomment and set the route
- If using Access, set `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD`

### Finding Your Account ID

```bash
wrangler whoami
```

Your account ID is shown in the output.

## Step 4: Build and Deploy

```bash
# Build the application
pnpm build

# Deploy to Cloudflare
pnpm deploy
```

## Step 5: Verify Deployment

```bash
# Check deployment status
pnpm wrangler deployments list

# View real-time logs
pnpm wrangler tail
```

Your app should now be live at:

- `https://voting-platform.<your-subdomain>.workers.dev` (if using workers.dev)
- Or your custom domain if configured

## Troubleshooting

### "Account ID not found" error

Run `wrangler whoami` to verify you're logged in and have the correct account.

### Database not found

Make sure the `database_id` in `wrangler.toml` matches your created database.

### Authentication not working

1. Verify `CF_ACCESS_TEAM_DOMAIN` is correct (no trailing slash)
2. Check the AUD tag matches exactly in your Access application
3. Ensure the Access policy allows your email

### Build errors with React Spectrum S2

Make sure you're using Node.js 18+ and have run `pnpm install`.

## Environment Variables Reference

| Variable                | Required | Description                        |
| ----------------------- | -------- | ---------------------------------- |
| `CF_ACCESS_TEAM_DOMAIN` | No       | Your Cloudflare Access team domain |
| `CF_ACCESS_AUD`         | No       | Access application AUD tag         |
| `APP_NAME`              | No       | App identifier for guest tracking  |

## Updating Your Deployment

```bash
# Make changes, then rebuild and deploy
pnpm build && pnpm deploy
```

## Using Local Development

```bash
# Start local dev server
pnpm dev

# Apply schema to local D1
pnpm wrangler d1 execute voting-platform --local --file=schema.sql
```

Local development uses local D1 and KV by default (no need for `wrangler.toml`).

## Production Checklist

- [ ] D1 database created and schema applied
- [ ] KV namespace created
- [ ] `wrangler.toml` configured with correct IDs
- [ ] Custom domain configured (optional)
- [ ] Cloudflare Access set up (optional)
- [ ] Build succeeds: `pnpm build`
- [ ] Deployment works: `pnpm deploy`
