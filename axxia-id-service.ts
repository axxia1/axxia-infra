// backend/AXXIA-ID/axxia-id-service.ts
import { generateAxxiaId } from './axxia-id';
// Ajusta este import a tu adaptador real (Prisma/Knex/pg)
// import { db } from '../db';

export async function createStakeholderId(typeCode: string, actor: string, sourceModule: string) {
  for (let i = 0; i < 5; i++) {
    const axxid = generateAxxiaId(typeCode);
    try {
      // Ejemplo con pg simple:
      // await db.query(
      //   'INSERT INTO axxia_id_audit(axxia_id, type_code, actor, source_module) VALUES ($1,$2,$3,$4)',
      //   [axxid, typeCode, actor, sourceModule]
      // );
      return axxid;
    } catch (e: any) {
      if (i === 4) throw e;
    }
  }
}