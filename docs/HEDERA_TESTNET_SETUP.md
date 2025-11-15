# Hedera Testnet Setup Guide

## Paso a Paso para Abrir Cuenta en Hedera Testnet

### Método 1: Portal Hedera (Recomendado - Más Fácil)

#### 1. Crear Cuenta en Portal Hedera

**URL:** https://portal.hedera.com

1. Click en **"Sign Up"** (esquina superior derecha)
2. Completa el formulario:
   ```
   Email: tu-email@ejemplo.com
   Password: (mínimo 8 caracteres)
   First Name: Tu Nombre
   Last Name: Tu Apellido
   ```
3. Verifica tu email (revisa spam si no llega)
4. Inicia sesión en https://portal.hedera.com

#### 2. Crear Testnet Account

1. Una vez dentro del portal, ve a **"Testnet"** en el menú lateral
2. Click en **"Create Account"**
3. El portal generará automáticamente:
   ```
   Account ID: 0.0.XXXXXXX (ejemplo: 0.0.4815162)
   Public Key: 302a300506032b657003210...
   Private Key: 302e020100300506032b657004220420...
   ```

4. **CRÍTICO:** Guarda estas credenciales de forma segura:
   ```bash
   # Crea archivo .env.hedera (NO SUBIR A GIT)
   HEDERA_ACCOUNT_ID=0.0.XXXXXXX
   HEDERA_PUBLIC_KEY=302a300506032b657003210...
   HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
   ```

#### 3. Obtener Test HBAR (Gratis)

1. En el portal, ve a **"Testnet" → "Faucet"**
2. Ingresa tu Account ID: `0.0.XXXXXXX`
3. Click **"Get HBAR"**
4. Recibirás **10,000 test HBAR** (suficiente para ~100,000 transacciones)
5. Verifica el balance en el portal

**Listo! Ya tienes tu cuenta Testnet funcionando.**

---

### Método 2: Hedera SDK (Programático)

Si prefieres crear la cuenta via código:

#### 1. Instalar Hedera SDK

```bash
npm install @hashgraph/sdk
```

#### 2. Crear Script de Setup

Crea archivo `scripts/hedera-setup.js`:

```javascript
const { Client, AccountCreateTransaction, Hbar, PrivateKey } = require("@hashgraph/sdk");

async function createTestnetAccount() {
  // 1. Conectar a Testnet
  const client = Client.forTestnet();

  // 2. Usar cuenta pre-financiada del Portal (si ya la tienes)
  // O usar la cuenta por defecto de Testnet
  const operatorId = "0.0.2"; // Cuenta testnet por defecto
  const operatorKey = PrivateKey.fromString(
    "302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137"
  );

  client.setOperator(operatorId, operatorKey);

  // 3. Generar nuevo par de llaves
  const newAccountPrivateKey = PrivateKey.generateED25519();
  const newAccountPublicKey = newAccountPrivateKey.publicKey;

  console.log("Generando nueva cuenta...");
  console.log("Private Key:", newAccountPrivateKey.toString());
  console.log("Public Key:", newAccountPublicKey.toString());

  // 4. Crear nueva cuenta con balance inicial
  const newAccount = await new AccountCreateTransaction()
    .setKey(newAccountPublicKey)
    .setInitialBalance(Hbar.fromTinybars(1000)) // 0.00001 HBAR
    .execute(client);

  // 5. Obtener Account ID
  const getReceipt = await newAccount.getReceipt(client);
  const newAccountId = getReceipt.accountId;

  console.log("\n✅ Cuenta creada exitosamente!");
  console.log("Account ID:", newAccountId.toString());
  console.log("\n⚠️  GUARDA ESTAS CREDENCIALES:");
  console.log("HEDERA_ACCOUNT_ID=" + newAccountId.toString());
  console.log("HEDERA_PUBLIC_KEY=" + newAccountPublicKey.toString());
  console.log("HEDERA_PRIVATE_KEY=" + newAccountPrivateKey.toString());

  process.exit(0);
}

createTestnetAccount().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
```

#### 3. Ejecutar Script

```bash
node scripts/hedera-setup.js
```

**Output esperado:**
```
Generando nueva cuenta...
Private Key: 302e020100300506032b657004220420...
Public Key: 302a300506032b657003210...

✅ Cuenta creada exitosamente!
Account ID: 0.0.4815162

⚠️  GUARDA ESTAS CREDENCIALES:
HEDERA_ACCOUNT_ID=0.0.4815162
HEDERA_PUBLIC_KEY=302a300506032b657003210...
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
```

#### 4. Fondear con Test HBAR

**Opción A: Usar Faucet Web**
- URL: https://portal.hedera.com/#/testnet/faucet
- Ingresa tu Account ID
- Obten 10,000 test HBAR gratis

**Opción B: Usar Faucet API**
```bash
curl -X POST "https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.XXXXXXX/credits" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000}'
```

---

### Método 3: Hedera Wallet (Mobile/Desktop)

#### 1. Descargar Wallet

**HashPack (Recomendado):**
- Chrome Extension: https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk
- Mobile: https://www.hashpack.app/download

**Blade Wallet:**
- Chrome Extension: https://chrome.google.com/webstore/detail/blade-hedera-web3-digital/abogmiocnneedmmepnohnhlijcjpcifd

#### 2. Crear Cuenta Testnet

1. Instala HashPack
2. Click **"Create New Wallet"**
3. Guarda tu frase mnemónica de 24 palabras (CRÍTICO)
4. Ve a **Settings → Network**
5. Selecciona **"Testnet"**
6. Copia tu Account ID (0.0.XXXXXXX)

#### 3. Obtener Test HBAR

1. Dentro de HashPack, ve a **"Receive"**
2. Copia tu Account ID
3. Ve a https://portal.hedera.com/#/testnet/faucet
4. Pega tu Account ID
5. Recibe 10,000 test HBAR

---

## Verificar que Todo Funciona

### Test 1: Verificar Balance

```javascript
// test-balance.js
const { Client, AccountBalanceQuery } = require("@hashgraph/sdk");

async function checkBalance() {
  const client = Client.forTestnet();

  const accountId = process.env.HEDERA_ACCOUNT_ID; // 0.0.XXXXXXX

  const balance = await new AccountBalanceQuery()
    .setAccountId(accountId)
    .execute(client);

  console.log("Account Balance:", balance.hbars.toString());
}

checkBalance();
```

**Ejecutar:**
```bash
HEDERA_ACCOUNT_ID=0.0.XXXXXXX node test-balance.js
```

**Output esperado:**
```
Account Balance: 10000 ℏ
```

### Test 2: Crear HCS Topic

```javascript
// test-topic.js
const { Client, TopicCreateTransaction, PrivateKey } = require("@hashgraph/sdk");

async function createTopic() {
  const client = Client.forTestnet();
  client.setOperator(
    process.env.HEDERA_ACCOUNT_ID,
    PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY)
  );

  console.log("Creando HCS topic...");

  const transaction = await new TopicCreateTransaction()
    .setTopicMemo("Axxia Consent Log - Test")
    .execute(client);

  const receipt = await transaction.getReceipt(client);
  const topicId = receipt.topicId;

  console.log("✅ Topic creado!");
  console.log("Topic ID:", topicId.toString());
  console.log("Costo:", "~$0.01 USD");
}

createTopic();
```

**Ejecutar:**
```bash
HEDERA_ACCOUNT_ID=0.0.XXXXXXX \
HEDERA_PRIVATE_KEY=302e020100300506... \
node test-topic.js
```

**Output esperado:**
```
Creando HCS topic...
✅ Topic creado!
Topic ID: 0.0.4815163
Costo: ~$0.01 USD
```

### Test 3: Enviar Mensaje a HCS

```javascript
// test-message.js
const { Client, TopicMessageSubmitTransaction, PrivateKey, TopicId } = require("@hashgraph/sdk");

async function sendMessage() {
  const client = Client.forTestnet();
  client.setOperator(
    process.env.HEDERA_ACCOUNT_ID,
    PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY)
  );

  const topicId = TopicId.fromString("0.0.4815163"); // Tu topic ID

  const message = {
    event: "consent_granted",
    patient_id: "patient123",
    timestamp: new Date().toISOString(),
  };

  console.log("Enviando mensaje a HCS...");

  const transaction = await new TopicMessageSubmitTransaction({
    topicId: topicId,
    message: JSON.stringify(message),
  }).execute(client);

  const receipt = await transaction.getReceipt(client);

  console.log("✅ Mensaje enviado!");
  console.log("Sequence Number:", receipt.topicSequenceNumber.toString());
  console.log("Costo:", "~$0.0001 USD");
}

sendMessage();
```

**Ejecutar:**
```bash
HEDERA_ACCOUNT_ID=0.0.XXXXXXX \
HEDERA_PRIVATE_KEY=302e020100300506... \
node test-message.js
```

**Output esperado:**
```
Enviando mensaje a HCS...
✅ Mensaje enviado!
Sequence Number: 1
Costo: ~$0.0001 USD
```

---

## Explorar Transacciones

### Hedera Testnet Explorer

**HashScan (Mejor para Testnet):**
- URL: https://hashscan.io/testnet

1. Ve a la URL
2. En la barra de búsqueda, ingresa:
   - Tu Account ID: `0.0.XXXXXXX`
   - O tu Topic ID: `0.0.4815163`
3. Verás:
   - Balance de cuenta
   - Historial de transacciones
   - Mensajes en HCS topics
   - Timestamps de consenso

**Dragon Glass (Alternativo):**
- URL: https://app.dragonglass.me/hedera/testnet

---

## Integración con Axxia Platform

### 1. Agregar Variables de Entorno

```bash
# .env.local
VITE_HEDERA_NETWORK=testnet
VITE_HEDERA_ACCOUNT_ID=0.0.XXXXXXX
VITE_HEDERA_PUBLIC_KEY=302a300506032b657003210...

# .env (server-side, NO EXPONER EN FRONTEND)
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
```

### 2. Crear Utility para Hedera

```typescript
// src/lib/hedera.ts
import { Client, TopicId, PrivateKey } from '@hashgraph/sdk';

const NETWORK = import.meta.env.VITE_HEDERA_NETWORK || 'testnet';

export function getHederaClient(): Client {
  const client = NETWORK === 'mainnet'
    ? Client.forMainnet()
    : Client.forTestnet();

  return client;
}

export const TOPICS = {
  CONSENT: TopicId.fromString('0.0.4815163'), // Reemplaza con tu topic real
  DATA_ACCESS: TopicId.fromString('0.0.4815164'),
  PRESCRIPTIONS: TopicId.fromString('0.0.4815165'),
};
```

### 3. Crear Supabase Edge Function

```bash
# Crear función
npx supabase functions new hedera-logger
```

Editar `supabase/functions/hedera-logger/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Client, TopicMessageSubmitTransaction, TopicId, PrivateKey } from 'npm:@hashgraph/sdk@2';

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

    const client = Client.forTestnet();
    client.setOperator(
      Deno.env.get('HEDERA_ACCOUNT_ID')!,
      PrivateKey.fromString(Deno.env.get('HEDERA_PRIVATE_KEY')!)
    );

    const transaction = await new TopicMessageSubmitTransaction({
      topicId: TopicId.fromString(topic),
      message: JSON.stringify(message),
    }).execute(client);

    const receipt = await transaction.getReceipt(client);

    return new Response(
      JSON.stringify({
        success: true,
        sequenceNumber: receipt.topicSequenceNumber.toString(),
        topicId: topic,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 4. Configurar Secrets en Supabase

```bash
# Configurar secrets para Edge Function
npx supabase secrets set HEDERA_ACCOUNT_ID=0.0.XXXXXXX
npx supabase secrets set HEDERA_PRIVATE_KEY=302e020100300506...
```

### 5. Desplegar Edge Function

```bash
npx supabase functions deploy hedera-logger
```

### 6. Probar desde Frontend

```typescript
// src/lib/api.ts
export async function logConsentToHedera(
  patientId: string,
  providerId: string,
  consentType: string
) {
  const message = {
    event: 'consent_granted',
    patient_id_hash: await hashSHA256(patientId),
    provider_id_hash: await hashSHA256(providerId),
    consent_type: consentType,
    timestamp: new Date().toISOString(),
  };

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hedera-logger`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        topic: '0.0.4815163', // TOPICS.CONSENT
        message,
      }),
    }
  );

  return response.json();
}

async function hashSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

---

## Costos y Límites (Testnet vs Mainnet)

| Feature | Testnet | Mainnet |
|---------|---------|---------|
| **Crear cuenta** | Gratis | $1 USD (una vez) |
| **Test HBAR** | 10,000 gratis | N/A |
| **HCS Message** | $0 (test HBAR) | $0.0001 USD |
| **Topic Creation** | $0 (test HBAR) | $0.01 USD |
| **Límite TPS** | 10,000 | 10,000 |
| **Persistencia** | Puede resetearse | Permanente |

---

## Troubleshooting

### Error: "INSUFFICIENT_PAYER_BALANCE"

**Causa:** No tienes suficiente test HBAR.

**Solución:**
1. Ve a https://portal.hedera.com/#/testnet/faucet
2. Ingresa tu Account ID
3. Recibe más test HBAR (puedes obtener hasta 10K cada 24 horas)

### Error: "INVALID_ACCOUNT_ID"

**Causa:** Account ID incorrecto o cuenta no existe.

**Solución:**
1. Verifica que tu Account ID tenga formato `0.0.XXXXXXX`
2. Chequea en HashScan que la cuenta existe: https://hashscan.io/testnet/account/0.0.XXXXXXX

### Error: "UNAUTHORIZED"

**Causa:** Private Key incorrecta o no coincide con Account ID.

**Solución:**
1. Verifica que `HEDERA_ACCOUNT_ID` y `HEDERA_PRIVATE_KEY` sean del mismo par
2. Regenera cuenta si perdiste las credenciales

### Error: "TOPIC_EXPIRED"

**Causa:** Los topics en Testnet pueden expirar después de 90 días de inactividad.

**Solución:**
1. Crea un nuevo topic con `TopicCreateTransaction`
2. En Mainnet, los topics NO expiran

---

## Próximos Pasos

### 1. Crear Topics de Producción

```bash
node scripts/create-topics.js
```

Esto creará:
- `axxia-consent-log` (0.0.XXXXXXX)
- `axxia-data-access` (0.0.XXXXXXX)
- `axxia-prescription-log` (0.0.XXXXXXX)

### 2. Implementar Frontend Components

- `ConsentManager.tsx` (captura consentimiento)
- `AuditTrailViewer.tsx` (visualiza logs HCS)
- `PrescriptionVerifier.tsx` (verifica recetas)

### 3. Testing

- Unit tests: Mock Hedera SDK
- Integration tests: Usar Testnet
- E2E tests: Validar flujo completo

### 4. Migrar a Mainnet

Cuando estés listo para producción:
1. Compra HBAR (Binance, Kraken)
2. Crea cuenta Mainnet en https://portal.hedera.com
3. Cambia `VITE_HEDERA_NETWORK=mainnet`
4. Actualiza topic IDs

---

## Recursos Adicionales

**Documentación Oficial:**
- Hedera Docs: https://docs.hedera.com
- HCS Guide: https://docs.hedera.com/guides/consensus-service
- SDK Reference: https://docs.hedera.com/hedera/sdks-and-apis

**Tutoriales:**
- HCS Tutorial: https://hedera.com/blog/how-to-use-hedera-consensus-service
- Video: https://www.youtube.com/watch?v=x_jKJh9tpYc

**Comunidad:**
- Discord: https://hedera.com/discord
- GitHub: https://github.com/hashgraph

**Soporte:**
- Portal Support: https://portal.hedera.com/support
- Email: support@hedera.com

---

**¡Estás listo para empezar con Hedera HCS!** 🚀

Una vez que completes estos pasos, podrás:
- Loggear eventos de consentimiento
- Crear audit trails inmutables
- Verificar integridad de datos
- Cumplir con HIPAA/GDPR/NOM-004

**Siguiente:** Implementar el primer componente `ConsentManager.tsx`
