# 🇪🇹 Digital Equb API

A modern, high-performance API for digitized traditional Ethiopian **Equb** (Rotating Savings and Credit Associations). This platform automates member vetting, payment verification via Chapa, and fair lottery draws, bringing trust and transparency to community finance.

---

## 🚀 Tech Stack

* **Runtime:** [Bun](https://bun.sh/) (Fast all-in-one JavaScript runtime)
* **API Framework:** [tsoa](https://tsoa-community.github.io/docs/) (OpenAPI/Swagger-compliant controllers)
* **ORM:** [Drizzle ORM](https://orm.drizzle.team/) (Type-safe SQL)
* **Database:** PostgreSQL
* **Payments:** [Chapa](https://chapa.co/) (Ethiopian Payment Gateway)
* **Validation:** TypeScript-first validation via tsoa

---

## ✨ Key Features

* **Admin-Controlled Groups:** Creators act as admins to vet and approve member requests.
* **Search & Discovery:** Browse active Equbs by title or contribution amount.
* **Secure Join Requests:** Users request to join; Admins approve/reject via a dedicated dashboard.
* **Automated Payment Verification:** Integration with Chapa Webhooks for real-time payment confirmation (Telebirr, M-Pesa, Bank).
* **Fair Lottery Draw:** Randomized winner selection restricted to members who have paid their dues.
* **Automated Payouts:** Instant transfer of the "pot" to the winner's account (minus platform fees).

---

## 🛠 Getting Started

### 1. Prerequisites
* [Install Bun](https://bun.sh/)
* PostgreSQL Database
* Chapa Secret Key (from [Chapa Dashboard](https://dashboard.chapa.co/))

### 2. Installation
```bash
git clone [https://github.com/bogidemasrepo/DigitalEqubAPI.git](https://github.com/bogidemasrepo/DigitalEqubAPI.git)
cd DigitalEqubAPI
bun install

```
### 2. Environment Setup
    PORT=3000
    DATABASE_URL=postgres://user:password@localhost:5432/equb_db
    JWT_SECRET=your_super_secret_key
    CHAPA_SECRET_KEY=CHASECK_TEST-xxxxxxxxxxxxxxxx

### 4. Database Migrations
```Bash

bun x drizzle-kit generate
bun x drizzle-kit migrate

```

### 5. Generate Routes & Swagger
```Bash

# This generates the tsoa routes and the swagger.json file
bun run gen
```

### 6. Run the App
```Bash

bun run dev

Visit http://localhost:3000/docs to view the interactive Swagger UI.
```


## 📁 Project Structure
```text
├── src
│   ├── controllers/    # tsoa Controllers (Equb, Payment, User)
│   ├── db/
│   │   ├── schema.ts   # Drizzle table definitions
│   │   └── index.ts    # DB connection
│   ├── services/       # Business logic (Lottery, Payouts, Errors)
│   └── app.ts          # Express/Bun entry point
├── drizzle/            # SQL migration files
├── tsoa.json           # Tsoa configuration
└── package.json        # Scripts and dependencies
```

## 🔒 Security

    - Webhook Verification: All Chapa payment notifications are verified using an HMAC-SHA256 signature to prevent spoofing.

    - Ownership Middleware: Only the adminId of a group can trigger draws or modify group settings.

    - Decentralized Admin: There are no global roles; users are "admins" only for the groups they create.
