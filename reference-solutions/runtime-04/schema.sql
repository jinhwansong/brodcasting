CREATE TABLE delivery_receipts (
 id text PRIMARY KEY CHECK (id ~ '^n-[a-f0-9]{16}$'),
 mode text NOT NULL CHECK (mode IN ('normal','transient','permanent','after-commit','slow')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE fake_deliveries (
 id text PRIMARY KEY REFERENCES delivery_receipts(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
