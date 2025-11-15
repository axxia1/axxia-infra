import dotenv from "dotenv";
import path from "path";

console.log("▶️  run-stakeholder.ts iniciado");
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
console.log("🧪 DATABASE_URL presente:", !!process.env.DATABASE_URL);

// espera a que el módulo termine
const mod = await import("./backend/test-create-stakeholder-pg.ts");
await mod.default;

console.log("✅ Script terminado");