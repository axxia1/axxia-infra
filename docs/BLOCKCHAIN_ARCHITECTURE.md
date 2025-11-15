# Blockchain Architecture - Axxia Health Platform

## Executive Summary

Axxia integrates **Hedera Hashgraph HCS** for immutable audit trails and **Stellar** for compliant healthcare payments, creating a secure, scalable, and regulatory-compliant health platform.

| Technology | Use Cases | Cost per Transaction | TPS | Finality |
|------------|-----------|---------------------|-----|----------|
| **Hedera HCS** | Consent logs, audit trails, data provenance | $0.0001 USD | 10,000+ | 3-5 seconds |
| **Stellar** | Payments, asset tokenization, settlements | $0.0001 USD | 5,000+ | 3-6 seconds |

---

## 1. Hedera Hashgraph Consensus Service (HCS)

### Overview

Hedera HCS acts as a **decentralized Kafka**, providing immutable, timestamped, and auditable logs for healthcare events.

### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Axxia Frontend (React)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase PostgreSQL                         │
│  ├─ axxia.patients (PII encrypted at rest)                  │
│  ├─ axxia.providers (credentials)                           │
│  ├─ axxia.visits (diagnoses, prescriptions)                 │
│  └─ axxia.consent_logs (local copy)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Hedera Edge Function (Supabase)                 │
│  ├─ Hash generator (SHA-256)                                │
│  ├─ HCS Topic publisher                                     │
│  └─ State proof validator                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           Hedera Hashgraph Network (Mainnet)                 │
│  ├─ HCS Topic: axxia-consent-log                           │
│  ├─ HCS Topic: axxia-data-access                           │
│  └─ HCS Topic: axxia-prescription-log                      │
└─────────────────────────────────────────────────────────────┘
```

### Use Cases

#### 1.1 Patient Consent Management

**Problem:** HIPAA requires auditable consent trails for data sharing.

**Solution:** Log every consent event to HCS with:
- Patient ID (hashed)
- Consent type (data sharing, research, billing)
- Timestamp (Hedera consensus timestamp)
- Provider ID (hashed)
- Revocation status

**Message Format:**
```json
{
  "event": "consent_granted",
  "patient_id_hash": "sha256:abc123...",
  "provider_id_hash": "sha256:def456...",
  "consent_type": "data_sharing",
  "scope": ["diagnoses", "prescriptions", "lab_results"],
  "expiration": "2026-12-31T23:59:59Z",
  "signature": "patient_ecdsa_signature"
}
```

**Cost:** $0.0001 USD per consent event

#### 1.2 Data Access Audit Trail

**Problem:** Regulatory compliance (HIPAA, GDPR) requires immutable logs of who accessed patient data.

**Solution:** Log every data access to HCS:
- User ID (provider/admin)
- Patient ID (hashed)
- Data accessed (table, columns)
- Timestamp
- IP address (hashed)
- Purpose of access

**Message Format:**
```json
{
  "event": "data_access",
  "user_id_hash": "sha256:user123...",
  "patient_id_hash": "sha256:patient456...",
  "data_accessed": ["axxia.visits", "axxia.diagnoses"],
  "purpose": "treatment",
  "ip_hash": "sha256:ip789...",
  "user_agent": "Mozilla/5.0..."
}
```

**Cost:** $0.0001 USD per access event

#### 1.3 Prescription Provenance

**Problem:** Combat prescription fraud and ensure drug traceability.

**Solution:** Hash prescriptions and log to HCS before generation:
- Prescription ID
- Medication (CIE-10 code)
- Dosage and instructions
- Prescriber ID (hashed)
- Patient ID (hashed)
- Timestamp
- QR code hash

**Message Format:**
```json
{
  "event": "prescription_issued",
  "prescription_id": "RX-20251101-001",
  "medication_atc": "N02BE01",
  "dosage": "500mg",
  "frequency": "q8h",
  "prescriber_id_hash": "sha256:doctor123...",
  "patient_id_hash": "sha256:patient456...",
  "qr_code_hash": "sha256:qr789..."
}
```

**Verification:** Pharmacies scan QR code, hash prescription data, and verify against HCS.

**Cost:** $0.0001 USD per prescription

### Technical Implementation

#### Phase 2 (Months 4-6)

**1. Hedera SDK Setup**
```typescript
// src/lib/hedera.ts
import { Client, TopicMessageSubmitTransaction, TopicId } from '@hashgraph/sdk';

const client = Client.forMainnet();
client.setOperator(
  import.meta.env.VITE_HEDERA_ACCOUNT_ID,
  import.meta.env.VITE_HEDERA_PRIVATE_KEY
);

export const TOPICS = {
  CONSENT: TopicId.fromString('0.0.123456'),
  DATA_ACCESS: TopicId.fromString('0.0.123457'),
  PRESCRIPTIONS: TopicId.fromString('0.0.123458'),
};

export async function logToHCS(topic: TopicId, message: object): Promise<string> {
  const transaction = new TopicMessageSubmitTransaction({
    topicId: topic,
    message: JSON.stringify(message),
  });

  const response = await transaction.execute(client);
  const receipt = await response.getReceipt(client);

  return receipt.topicSequenceNumber.toString();
}
```

**2. Supabase Edge Function**
```typescript
// supabase/functions/hedera-logger/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { Client, TopicMessageSubmitTransaction } from 'npm:@hashgraph/sdk@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { topic, message } = await req.json();

    const hederaClient = Client.forMainnet();
    hederaClient.setOperator(
      Deno.env.get('HEDERA_ACCOUNT_ID')!,
      Deno.env.get('HEDERA_PRIVATE_KEY')!
    );

    const transaction = new TopicMessageSubmitTransaction({
      topicId: topic,
      message: JSON.stringify(message),
    });

    const response = await transaction.execute(hederaClient);
    const receipt = await response.getReceipt(hederaClient);

    return new Response(
      JSON.stringify({
        success: true,
        sequenceNumber: receipt.topicSequenceNumber.toString(),
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

**3. Database Trigger for Auto-Logging**
```sql
-- Log all data access to Hedera HCS
CREATE OR REPLACE FUNCTION log_data_access_to_hedera()
RETURNS TRIGGER AS $$
BEGIN
  -- Call edge function to log to Hedera
  PERFORM net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/hedera-logger',
    body := json_build_object(
      'topic', '0.0.123457',
      'message', json_build_object(
        'event', 'data_access',
        'user_id_hash', encode(digest(auth.uid()::text, 'sha256'), 'hex'),
        'patient_id_hash', encode(digest(NEW.id::text, 'sha256'), 'hex'),
        'timestamp', NOW()
      )
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_patient_access
AFTER SELECT ON axxia.patients
FOR EACH ROW
EXECUTE FUNCTION log_data_access_to_hedera();
```

### Compliance Benefits

| Regulation | Requirement | Hedera HCS Solution |
|------------|-------------|---------------------|
| **HIPAA** | Audit trails for PHI access | Immutable HCS logs with timestamps |
| **GDPR** | Right to be forgotten | Store hashes only, delete local data |
| **21 CFR Part 11** | Electronic records integrity | Cryptographic proofs via HCS |
| **NOM-004-SSA3** (Mexico) | Prescription traceability | HCS prescription logs + QR verification |

### Cost Analysis

| Event Type | Volume (Annual) | Cost per Event | Total Annual Cost |
|------------|-----------------|----------------|-------------------|
| Consent events | 50,000 | $0.0001 | $5 |
| Data access logs | 500,000 | $0.0001 | $50 |
| Prescriptions | 100,000 | $0.0001 | $10 |
| **Total** | **650,000** | - | **$65/year** |

**ROI:** Avoid regulatory fines ($100K-$50M for HIPAA breaches) with a $65/year investment.

---

## 2. Stellar Network for Payments

### Overview

Stellar provides **compliant, low-cost cross-border payments** for healthcare transactions, including:
- Doctor payments (fee-for-service)
- Patient co-pays
- Insurance settlements
- Medical supply payments
- Tokenized health savings accounts (HSAs)

### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Axxia Frontend (React)                    │
│  └─ Stellar Payment Widget                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Stellar Edge Function (Supabase)                │
│  ├─ Payment initiation                                      │
│  ├─ KYC/AML verification                                    │
│  └─ Clawback for disputes                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Stellar Network (Mainnet)                   │
│  ├─ Anchors: MXN, USD stablecoins                          │
│  ├─ AXXIA Token (utility token)                            │
│  └─ Smart Contracts (Soroban)                              │
└─────────────────────────────────────────────────────────────┘
```

### Use Cases

#### 2.1 Doctor Payment Settlements

**Problem:** Slow insurance reimbursements (30-90 days) hurt provider cash flow.

**Solution:** Instant Stellar payments with automatic splitting:
- 80% to provider (MXN stablecoin)
- 15% to Axxia platform fee
- 5% to provider network (if referral)

**Transaction Flow:**
```
Patient → USDC/MXN → Smart Contract (Soroban) → Split Payment
                                                  ├─ 80% Provider
                                                  ├─ 15% Axxia
                                                  └─ 5% Network
```

**Cost:** $0.0001 USD per payment

#### 2.2 Tokenized Health Savings Accounts (HSAs)

**Problem:** Traditional HSAs are illiquid and hard to manage.

**Solution:** Issue **AXXIA-HSA tokens** on Stellar:
- 1 AXXIA-HSA = 1 MXN
- Redeemable for medical services
- Transferable between family members
- Earns yield via Stellar liquidity pools

**Token Features:**
- **Asset Code:** AXXIAHSA
- **Issuer:** Axxia Platform (with freeze/clawback for compliance)
- **Trustline Required:** Yes (patient opt-in)
- **Compliance:** KYC via Stellar SEP-12

**Smart Contract (Soroban):**
```rust
// Restrict AXXIA-HSA spending to verified providers
pub fn spend_hsa(
    patient: Address,
    provider: Address,
    amount: i128,
) -> Result<(), Error> {
    // Verify provider is registered in Axxia DB
    require(is_verified_provider(provider), Error::UnverifiedProvider);

    // Transfer tokens
    token::transfer(patient, provider, amount);

    Ok(())
}
```

#### 2.3 Cross-Border Medical Tourism Payments

**Problem:** International patients struggle with currency exchange and payment verification.

**Solution:** Stellar path payments with automatic currency conversion:
- Patient pays in USD (USDC)
- Provider receives MXN (MoneyGram/Bitso anchor)
- Automatic best-rate conversion via Stellar DEX
- Settlement in 3-6 seconds

**Cost:** $0.0001 USD + 0.1% spread

### Technical Implementation

#### Phase 3 (Months 7-12)

**1. Stellar SDK Setup**
```typescript
// src/lib/stellar.ts
import {
  Server,
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Asset
} from '@stellar/stellar-sdk';

const server = new Server('https://horizon.stellar.org');

export const AXXIA_ASSETS = {
  HSA: new Asset('AXXIAHSA', import.meta.env.VITE_STELLAR_ISSUER_PUBLIC),
  TOKEN: new Asset('AXXIA', import.meta.env.VITE_STELLAR_ISSUER_PUBLIC),
};

export async function sendPayment(
  sourceSecret: string,
  destination: string,
  amount: string,
  asset: Asset
): Promise<string> {
  const sourceKeypair = Keypair.fromSecret(sourceSecret);
  const account = await server.loadAccount(sourceKeypair.publicKey());

  const transaction = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.PUBLIC,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset,
        amount,
      })
    )
    .setTimeout(30)
    .build();

  transaction.sign(sourceKeypair);
  const result = await server.submitTransaction(transaction);

  return result.hash;
}
```

**2. Payment Splitting Smart Contract (Soroban)**
```rust
// contracts/payment_splitter/src/lib.rs
#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, token};

#[contract]
pub struct PaymentSplitter;

#[contractimpl]
impl PaymentSplitter {
    pub fn split_consultation_fee(
        env: Env,
        payer: Address,
        provider: Address,
        platform: Address,
        amount: i128,
    ) -> Result<(), Error> {
        let provider_share = amount * 80 / 100;  // 80%
        let platform_share = amount * 15 / 100;  // 15%
        let network_share = amount * 5 / 100;    // 5%

        // Transfer to provider
        token::transfer(&env, &payer, &provider, &provider_share);

        // Transfer to platform
        token::transfer(&env, &payer, &platform, &platform_share);

        // Transfer to network pool
        token::transfer(&env, &payer, &get_network_pool(), &network_share);

        Ok(())
    }
}
```

**3. Supabase Edge Function for Payments**
```typescript
// supabase/functions/stellar-payment/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  Server,
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Asset
} from 'npm:stellar-sdk@11';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { destination, amount, memo } = await req.json();

    const server = new Server('https://horizon.stellar.org');
    const sourceKeypair = Keypair.fromSecret(Deno.env.get('STELLAR_SECRET')!);

    const account = await server.loadAccount(sourceKeypair.publicKey());

    const transaction = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: Networks.PUBLIC,
    })
      .addOperation(
        Operation.payment({
          destination,
          asset: Asset.native(), // XLM
          amount: amount.toString(),
        })
      )
      .addMemo(Memo.text(memo))
      .setTimeout(30)
      .build();

    transaction.sign(sourceKeypair);
    const result = await server.submitTransaction(transaction);

    return new Response(
      JSON.stringify({
        success: true,
        hash: result.hash,
        ledger: result.ledger,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Compliance Features

#### KYC/AML via SEP-12

Stellar's **SEP-12** standard enables compliant customer verification:

```typescript
// KYC submission to anchor
const kycData = {
  first_name: 'Juan',
  last_name: 'Pérez',
  email: 'juan@example.com',
  id_type: 'CURP',
  id_number: 'JUAP850101HDFRRN01',
  proof_of_address: 'base64_encoded_document',
};

await fetch('https://anchor.example.com/sep12/customer', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${stellarToken}`,
  },
  body: JSON.stringify(kycData),
});
```

#### Asset Controls (Freeze/Clawback)

Enable **clawback** for fraud prevention:

```typescript
// Enable clawback when issuing AXXIA-HSA token
const issuerKeypair = Keypair.fromSecret(issuerSecret);
const transaction = new TransactionBuilder(account, {
  fee: '100',
  networkPassphrase: Networks.PUBLIC,
})
  .addOperation(
    Operation.setOptions({
      setFlags: AuthClawbackEnabledFlag, // Enable clawback
    })
  )
  .build();
```

**Use Case:** Clawback fraudulent HSA token transfers.

### Cost Analysis

| Transaction Type | Volume (Annual) | Cost per Tx | Total Annual Cost |
|------------------|-----------------|-------------|-------------------|
| Consultation payments | 100,000 | $0.0001 | $10 |
| HSA token transfers | 50,000 | $0.0001 | $5 |
| Insurance settlements | 10,000 | $0.0001 | $1 |
| Cross-border payments | 5,000 | $0.0001 | $0.50 |
| **Total** | **165,000** | - | **$16.50/year** |

**Additional Costs:**
- KYC verification: $1-5 per user (one-time)
- Anchor fees: 0.1-0.5% of transaction value

---

## 3. Integration Architecture

### Hybrid Model: Supabase + Hedera + Stellar

```
┌───────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                    │
│  ├─ Patient/Provider Registration                             │
│  ├─ Medical Visits (Diagnoses, Rx, Labs)                      │
│  ├─ Payment Widget (Stellar)                                  │
│  └─ Consent Manager (Hedera HCS)                              │
└────────────────┬──────────────────────────────────────────────┘
                 │
                 ▼
┌───────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                       │
│  ├─ axxia.patients (encrypted PII)                            │
│  ├─ axxia.providers                                           │
│  ├─ axxia.visits                                              │
│  ├─ axxia.consent_logs (local copy)                           │
│  └─ axxia.payment_transactions                                │
└────────┬──────────────────────┬─────────────────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────────┐  ┌─────────────────────────────┐
│  Hedera HCS Logger  │  │  Stellar Payment Processor  │
│  (Edge Function)    │  │  (Edge Function)            │
│  ├─ Consent events  │  │  ├─ Payment initiation      │
│  ├─ Data access     │  │  ├─ Token transfers         │
│  └─ Rx provenance   │  │  └─ Smart contract calls    │
└──────────┬──────────┘  └──────────┬──────────────────┘
           │                        │
           ▼                        ▼
┌─────────────────────┐  ┌─────────────────────────────┐
│  Hedera Mainnet     │  │  Stellar Mainnet            │
│  └─ HCS Topics      │  │  ├─ Anchors (MXN/USD)       │
│                     │  │  ├─ AXXIA Tokens            │
│                     │  │  └─ Soroban Contracts       │
└─────────────────────┘  └─────────────────────────────┘
```

### Data Flow Example: Complete Visit Workflow

1. **Patient Check-In**
   - Frontend: Scan QR code → Retrieve patient from Supabase
   - Hedera: Log data access event to HCS

2. **Medical Consultation**
   - Frontend: Provider enters diagnoses, prescriptions
   - Supabase: Store visit data (RLS enforced)

3. **Prescription Generation**
   - Frontend: Generate prescription PDF with QR code
   - Hedera: Hash prescription + log to HCS
   - Supabase: Store prescription metadata

4. **Payment Processing**
   - Frontend: Display payment options (Stellar)
   - Stellar: Patient pays via USDC → Split to provider/platform
   - Supabase: Record payment transaction

5. **Post-Visit Consent**
   - Frontend: Patient grants consent for data sharing
   - Hedera: Log consent event to HCS
   - Supabase: Update consent_logs table

**Total Cost:** $0.0003 USD (3 HCS logs + 1 Stellar payment)

---

## 4. Security & Compliance

### Data Privacy Strategy

| Data Type | Storage Location | Encryption | Blockchain Logging |
|-----------|------------------|------------|-------------------|
| **PII (names, CURP)** | Supabase (encrypted at rest) | AES-256 | ❌ Never (hashes only) |
| **Medical records** | Supabase | AES-256 + column-level | ❌ Never (hashes only) |
| **Consent events** | Hedera HCS | N/A (public) | ✅ Hashed IDs |
| **Data access logs** | Hedera HCS | N/A (public) | ✅ Hashed IDs + IP |
| **Payment data** | Stellar + Supabase | N/A (public ledger) | ✅ Transaction hashes |
| **Prescription hashes** | Hedera HCS | N/A (public) | ✅ Full hashes |

**Key Principle:** NEVER store PII or PHI on public blockchains. Only log cryptographic hashes and metadata.

### Regulatory Compliance Mapping

#### HIPAA (US Healthcare)

| Requirement | Implementation |
|-------------|----------------|
| **Audit Controls (§164.312(b))** | Hedera HCS logs all data access |
| **Integrity Controls (§164.312(c)(1))** | SHA-256 hashes + HCS timestamps |
| **Access Controls (§164.312(a)(1))** | Supabase RLS + Hedera consent logs |
| **Encryption (§164.312(a)(2)(iv))** | AES-256 at rest, TLS 1.3 in transit |

#### GDPR (EU Privacy)

| Requirement | Implementation |
|-------------|----------------|
| **Right to be Forgotten (Art. 17)** | Delete Supabase data, keep HCS hashes (non-reversible) |
| **Data Portability (Art. 20)** | Export from Supabase + HCS logs as JSON |
| **Consent Tracking (Art. 7)** | Hedera HCS immutable consent logs |
| **Data Breach Notification (Art. 33)** | Hedera HCS audit trail for forensics |

#### NOM-004-SSA3-2012 (Mexico Prescriptions)

| Requirement | Implementation |
|-------------|----------------|
| **Electronic Prescription Validity** | Hedera HCS timestamp + provider signature |
| **Prescription Traceability** | HCS provenance log + QR code verification |
| **Controlled Substances Tracking** | Flag in Supabase + HCS double-logging |

### Threat Model & Mitigations

| Threat | Impact | Mitigation |
|--------|--------|------------|
| **Database breach (Supabase)** | PII exposure | AES-256 encryption + hashed IDs on HCS prevent linking |
| **Insider data theft** | Provider steals patient data | Hedera HCS logs all access → forensic audit trail |
| **Prescription fraud** | Fake prescriptions | HCS provenance + QR verification at pharmacy |
| **Payment fraud** | Stolen HSA tokens | Stellar clawback enabled + KYC via SEP-12 |
| **Consent repudiation** | Patient denies consent | Immutable HCS logs with patient signature |

---

## 5. Implementation Roadmap

### Phase 2: Hedera HCS Integration (Months 4-6)

**Goal:** Immutable audit trails for consent and data access.

#### Milestones

**Month 4: Setup & Testing**
- [ ] Register Hedera Mainnet account
- [ ] Create HCS topics:
  - `axxia-consent-log` (Topic ID: 0.0.123456)
  - `axxia-data-access` (Topic ID: 0.0.123457)
  - `axxia-prescription-log` (Topic ID: 0.0.123458)
- [ ] Deploy Supabase Edge Function: `hedera-logger`
- [ ] Integrate Hedera SDK into frontend (`@hashgraph/sdk`)
- [ ] Write unit tests for HCS logging

**Month 5: Consent Management**
- [ ] Build consent UI component (`ConsentManager.tsx`)
- [ ] Implement patient signature capture (ECDSA)
- [ ] Log all consent events to HCS
- [ ] Create Supabase trigger for auto-logging
- [ ] Audit console: Display HCS logs in admin dashboard

**Month 6: Data Access Auditing**
- [ ] Implement RLS policies with access logging
- [ ] Log all SELECT queries to HCS (via trigger)
- [ ] Prescription hash generator + QR code
- [ ] Pharmacy verification portal (scan QR → verify HCS)
- [ ] Compliance report generator (export HCS logs)

**Deliverables:**
- 3 HCS topics operational
- 100% consent events logged
- 100% data access audited
- Prescription fraud prevention active

**Estimated Cost:** $100-500 (depending on transaction volume)

---

### Phase 3: Stellar Payments (Months 7-12)

**Goal:** Enable instant, compliant healthcare payments.

#### Milestones

**Month 7-8: Stellar Setup**
- [ ] Register Stellar issuer account
- [ ] Issue AXXIA-HSA token (with clawback enabled)
- [ ] Deploy payment splitter smart contract (Soroban)
- [ ] Integrate Stellar SDK (`@stellar/stellar-sdk`)
- [ ] Deploy Supabase Edge Function: `stellar-payment`

**Month 9: Payment Flows**
- [ ] Build payment widget (`StellarPaymentWidget.tsx`)
- [ ] Implement consultation fee splitting (80/15/5)
- [ ] HSA token issuance to patients
- [ ] Provider withdrawal to fiat (via anchor)
- [ ] Payment receipt generation (PDF)

**Month 10: KYC/AML Compliance**
- [ ] Integrate SEP-12 KYC flow
- [ ] Partner with Mexican anchor (Bitso/MoneyGram)
- [ ] Implement identity verification (CURP + INE)
- [ ] Clawback mechanism for disputed payments
- [ ] AML monitoring dashboard

**Month 11-12: Advanced Features**
- [ ] Cross-border payments (USD → MXN)
- [ ] HSA liquidity pools (yield generation)
- [ ] Provider referral network payouts
- [ ] Insurance integration (claims → Stellar)
- [ ] Analytics dashboard (payment volume, fees)

**Deliverables:**
- AXXIA-HSA token live on Stellar Mainnet
- 1,000+ patients with funded HSA accounts
- 100+ providers receiving payments via Stellar
- <$0.01 average transaction cost

**Estimated Cost:** $500-2,000 (anchors, KYC, initial liquidity)

---

## 6. Cost-Benefit Analysis

### Total Annual Blockchain Costs (10,000 patients, 50 providers)

| Category | Volume | Cost per Unit | Annual Cost |
|----------|--------|---------------|-------------|
| **Hedera HCS** | | | |
| Consent events | 20,000 | $0.0001 | $2 |
| Data access logs | 200,000 | $0.0001 | $20 |
| Prescriptions | 50,000 | $0.0001 | $5 |
| **Stellar** | | | |
| Consultation payments | 50,000 | $0.0001 | $5 |
| HSA transfers | 20,000 | $0.0001 | $2 |
| Provider withdrawals | 5,000 | $0.0001 | $0.50 |
| **Anchors/KYC** | | | |
| KYC verifications | 10,000 | $2 | $20,000 |
| Anchor fees (0.3% avg) | $500,000 | 0.3% | $1,500 |
| **Infrastructure** | | | |
| Hedera account maintenance | - | - | $50 |
| Stellar account reserves (10,100 XLM) | - | ~$0.10/XLM | $1,010 |
| **Total** | | | **$22,594.50** |

### Revenue Potential

| Revenue Stream | Volume | Price | Annual Revenue |
|----------------|--------|-------|----------------|
| Platform fee (15% of consultations) | 50,000 | $7.50 avg | $562,500 |
| HSA management fee (2% AUM) | $500,000 | 2% | $10,000 |
| Subscription (providers) | 50 | $50/month | $30,000 |
| **Total** | | | **$602,500** |

**Net Profit:** $602,500 - $22,595 = **$579,905/year**

**ROI:** 2,566% (25x return)

---

## 7. Competitive Advantages

### Why Hedera + Stellar?

| Feature | Traditional System | Axxia (Hedera + Stellar) |
|---------|-------------------|--------------------------|
| **Audit Trail** | Mutable database logs | Immutable HCS (tamper-proof) |
| **Payment Speed** | 3-5 business days | 3-6 seconds |
| **Transaction Cost** | $0.50-3.00 (ACH/wire) | $0.0001 (Stellar) |
| **Cross-Border** | 5-10% fees, 3-7 days | 0.1% fees, 6 seconds |
| **Compliance** | Manual audits, $50K/year | Automated HCS logs, $65/year |
| **Fraud Prevention** | Reactive (after loss) | Proactive (HCS verification) |
| **Interoperability** | Siloed (EHR lock-in) | Open (Hedera + Stellar APIs) |

### Market Differentiators

1. **First Mexican Health Platform with Blockchain Audit Trails**
   - No competitor uses Hedera HCS for consent management
   - Unique selling point for enterprise clients (hospitals, insurers)

2. **Sub-Cent Healthcare Payments**
   - Stellar enables micropayments for telemedicine ($0.50 consults)
   - Opens new markets (rural, unbanked patients)

3. **Regulatory Compliance by Design**
   - Built-in HIPAA/GDPR compliance via HCS
   - Reduces legal/audit costs by 90%

4. **Tokenized Health Savings**
   - AXXIA-HSA tokens earn yield via Stellar liquidity pools
   - Patient incentive to stay in ecosystem

---

## 8. Risks & Mitigations

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Hedera network downtime** | Low | High | Cache HCS logs locally, sync when online |
| **Stellar anchor insolvency** | Medium | High | Use multiple anchors, monitor reserves |
| **Smart contract bugs** | Medium | Medium | Audit Soroban contracts (OpenZeppelin) |
| **Private key theft** | Low | Critical | Hardware wallets, multi-sig for issuer |

### Regulatory Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Blockchain = securities** | Medium | High | AXXIA-HSA as utility token, not investment |
| **KYC/AML failures** | Low | Critical | Use licensed anchors (Bitso), SEP-12 |
| **GDPR "right to be forgotten"** | Medium | Medium | Only store hashes on HCS (non-reversible) |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Low patient adoption** | Medium | High | Free HSA tokens for early adopters |
| **Provider resistance** | High | Medium | Instant settlements (vs 30-90 days) |
| **Competitor copies architecture** | High | Low | First-mover advantage, network effects |

---

## 9. Next Steps

### Immediate Actions (This Week)

1. **Open Hedera Testnet Account**
   - URL: https://portal.hedera.com
   - Create account, get test HBAR
   - Deploy test HCS topic

2. **Open Stellar Testnet Account**
   - URL: https://laboratory.stellar.org
   - Generate keypair, fund with test XLM
   - Issue test AXXIA-HSA token

3. **Prototype Edge Functions**
   - `hedera-logger` (log consent events)
   - `stellar-payment` (send test XLM)

### Medium-Term (Next 30 Days)

1. **Finalize Architecture**
   - Review this document with team
   - Prioritize Phase 2 (Hedera) vs Phase 3 (Stellar)
   - Allocate budget ($2K initial for mainnet accounts)

2. **Build MVP Components**
   - `ConsentManager.tsx` (capture patient consent)
   - `HCSLogger.ts` (log to Hedera)
   - `PaymentWidget.tsx` (Stellar payment UI)

3. **Compliance Review**
   - Consult healthcare attorney (NOM-004-SSA3)
   - Draft privacy policy (GDPR compliant)
   - Plan KYC flow (SEP-12)

---

## 10. Conclusion

Integrating **Hedera HCS** and **Stellar** positions Axxia as the **most compliant and cost-effective health platform in Mexico**.

**Key Takeaways:**
- **Hedera HCS:** $65/year for immutable audit trails (vs $50K+ for manual compliance)
- **Stellar:** $16.50/year for instant payments (vs $0.50-3.00 per traditional transaction)
- **ROI:** 2,566% annual return on blockchain investment
- **Compliance:** Built-in HIPAA/GDPR/NOM-004 compliance

**The future of healthcare is decentralized, transparent, and instant. Axxia is leading that future.**

---

## Appendix A: Useful Resources

### Hedera
- **Docs:** https://docs.hedera.com
- **Portal:** https://portal.hedera.com
- **SDK (JavaScript):** https://github.com/hashgraph/hedera-sdk-js
- **Explorer:** https://hashscan.io

### Stellar
- **Docs:** https://developers.stellar.org
- **Laboratory:** https://laboratory.stellar.org
- **SDK (JavaScript):** https://github.com/stellar/js-stellar-sdk
- **Explorer:** https://stellar.expert

### Compliance
- **HIPAA:** https://www.hhs.gov/hipaa
- **GDPR:** https://gdpr.eu
- **NOM-004-SSA3:** https://www.dof.gob.mx/nota_detalle.php?codigo=5284147

### Anchors (Mexico)
- **Bitso:** https://bitso.com (MXN anchor)
- **MoneyGram:** https://moneygram.com (USD/MXN bridge)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-01
**Author:** Axxia Platform Team
**License:** Proprietary - Internal Use Only
