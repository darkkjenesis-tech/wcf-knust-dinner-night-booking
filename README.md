<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8ff3436e-ffbb-416a-a7f3-29e0a446a9d9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Paystack setup

To enable Paystack payments you must set the secret key on the server. Create a `.env` file at the project root with:

PAYSTACK_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Where to put them
- Server (secret key): add `PAYSTACK_SECRET_KEY` to the project root `.env` (this value must remain private).
- Client (public key, optional): add `PAYSTACK_PUBLIC_KEY` to the project root `.env` if you plan to use Paystack inline or client-side SDK.

Example (interactive, safe):
```bash
# backup and preserve existing .env
cp .env .env.bak 2>/dev/null || true
touch .env
sed -i '' '/^PAYSTACK_SECRET_KEY=/d' .env 2>/dev/null || true
sed -i '' '/^PAYSTACK_PUBLIC_KEY=/d' .env 2>/dev/null || true
read -s -p "Enter Paystack SECRET key (sk_live...): " PAYSTACK_SECRET_KEY; printf "\n"
read -p "Enter Paystack PUBLIC key (pk_live...): " PAYSTACK_PUBLIC_KEY; printf "\n"
printf 'PAYSTACK_SECRET_KEY=%s\nPAYSTACK_PUBLIC_KEY=%s\n' "$PAYSTACK_SECRET_KEY" "$PAYSTACK_PUBLIC_KEY" >> .env
```

Start the app in development:
```bash
npm install
npm run dev
```

The app uses server endpoints at `/api/paystack/initialize` and `/api/paystack/verify/:reference` to handle Paystack transactions. Amounts are sent in the smallest currency unit (pesewas for GHS) — the frontend multiplies the displayed amount by 100 before sending.
