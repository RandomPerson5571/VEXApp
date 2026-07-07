# Auth email templates

Branded HTML templates for Supabase Auth (or any provider using Go template variables).

## Templates

| File | Supabase template |
|------|-------------------|
| `confirm-sign-up.html` | Confirm sign up |
| `invite-user.html` | Invite user |
| `magic-link-or-otp.html` | Magic link / OTP |
| `change-email-address.html` | Change email address |
| `reset-password.html` | Reset password |
| `reauthentication.html` | Reauthentication |

## Brand

Matches the STL Robotics app UI:

- **Header:** `#ffa800` (hero orange) with logo from `{{ .SiteURL }}/icon.png`
- **Card:** `#090e18` on `#0b0f16` background (login/dashboard dark theme)
- **Accent:** `#ea580c` / `#fdb71c` / `#cf6106` (lion orange palette)
- **Typography:** Arial/Helvetica with uppercase labels and slate body copy

Each template includes a flow-specific inline SVG icon (gold stroke on dark badge).

## Variables

- `{{ .ConfirmationURL }}` — action link
- `{{ .Token }}` — one-time code (magic link, reset, reauth)
- `{{ .SiteURL }}` — site base URL (logo image)

## Setup

1. Supabase Dashboard → Authentication → Email Templates
2. Paste each HTML file into the matching template
3. Ensure `Site URL` in Supabase matches your deployed `NEXT_PUBLIC_SITE_URL` so the logo loads

Optional: swap `{{ .SiteURL }}/icon.png` for `{{ .SiteURL }}/logos/Robotics_lion.svg` if your mail client supports SVG images.
