# ART & ARTIST

A professional creative network built with Next.js 16, TypeScript, Tailwind CSS, Supabase Auth, PostgreSQL, Storage, and Realtime.

## Local setup

Use Node.js 20.9 or later and npm. Open PowerShell in the `art-and-artist` project folder:

```powershell
npm install
Copy-Item .env.example .env.local
```

In .env.local, set the project URL and publishable key from Supabase Project Settings → API:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The publishable key may be used by the browser. Do not add a service-role key to the app or to a NEXT_PUBLIC variable.

Apply the checked-in schema and storage policies:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Seed the craft taxonomy by running supabase/seed.sql in the Supabase SQL Editor. To use the local Supabase stack, install Docker Desktop first, then run npx supabase start and npx supabase db reset. Database policy checks are in supabase/tests/rls.test.sql and run with npx supabase test db.

Set auth Site URL to http://localhost:3000 and add http://localhost:3000/auth/callback as a redirect URL. For Google auth, enable the provider in Supabase Auth and configure its OAuth credentials and callback there.

## Run and verify

```powershell
npm run dev
```

Keep the development server in that terminal. Open http://localhost:3000. In a second PowerShell terminal in the project folder, run:

```powershell
npm run lint
npm run typecheck
npm run build
```

The public collections read live Supabase records; with no backend configured, they show setup/empty states and do not claim writes succeeded. Create two real test accounts to check the full request, accept, message, attachment, realtime, notification, and privacy flow. Uploads are validated by file type, size, storage path, and RLS. `supabase/tests/rls.test.sql` checks schema and policy invariants; use two authenticated accounts against a configured Supabase project for behavioral RLS verification.

Create the first admin role from Supabase SQL Editor after registering the admin account:

```sql
insert into public.admin_roles(owner_id, role)
select user_id, 'admin' from public.profiles where username = 'YOUR_USERNAME';
```

Never grant admin roles from client code. Keep all .env.local files out of Git.

## GitHub

Create an empty GitHub repository named `art-and-artist`. From the project folder (the Git repository root):

```powershell
git init
git add .
git commit -m "Build ART & ARTIST application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/art-and-artist.git
git push -u origin main
```

If this folder is already connected to a remote, inspect it with git remote -v first; use git remote set-url origin ... only when you intend to change it.

## Vercel and live test

1. Import the GitHub repository into Vercel. Use `./` as Root Directory because the repository root is this project folder.
2. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for Preview and Production.
3. Deploy with the detected Next.js build settings.
4. In Supabase Auth URL Configuration, set the production Site URL and add https://YOUR_DOMAIN/auth/callback.
5. Enable Google in Supabase Auth Providers if using Google sign-in, and register the Supabase OAuth callback URL at Google Cloud.
6. Link the production database and apply the committed migrations with npx supabase db push.
7. Open the production URL in two private browser sessions. Create User A and User B, finish onboarding, add work and a profile image, send a connection request, accept it as the other user, then exchange a message and attachment. The recipient should see the message without refreshing.
8. Verify profile visibility, private portfolio behavior, notification persistence, job application and collaboration flows, and that one account cannot open the other account's conversations or edit its profile.
9. Check Vercel build logs and the browser console. Review the live layout at 390x844, 768x1024, and 1440x900.

## Main routes

Landing; Discover; Connect; Search; Connections; onboarding; profiles and profile editing; work publishing and detail; Projects; Jobs and applications; Collaborations and interests; Journal; Organizations; Realtime Messages; Notifications; privacy settings; admin moderation.
