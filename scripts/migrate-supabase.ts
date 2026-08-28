import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno (.env en raíz y directorio actual)
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Error: Faltan las variables SUPABASE_URL / VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  console.log("🚀 Iniciando proceso de migración de datos en Supabase...");

  // 1) Migración: 'messages' -> 'case_messages'
  console.log("\n📦 [1/2] Verificando migración de 'messages' a 'case_messages'...");
  try {
    const { data: oldMessages, error: oldMessagesError } = await supabaseAdmin
      .from('messages')
      .select('*');

    if (oldMessagesError) {
      console.warn("⚠️ No se pudo leer la tabla origen 'messages' (probablemente no existe o está vacía):", oldMessagesError.message);
    } else if (!oldMessages || oldMessages.length === 0) {
      console.log("ℹ️ No hay registros en la tabla 'messages' para migrar.");
    } else {
      console.log(`Encontrados ${oldMessages.length} registros en 'messages'. Migrando a 'case_messages'...`);
      
      let migratedCount = 0;
      for (const msg of oldMessages) {
        const newMsg = {
          case_id: msg.case_id || msg.user_id,
          user_id: msg.user_id || msg.case_id,
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text || msg.content || '',
          sources: msg.sources || []
        };

        const { error: insertError } = await supabaseAdmin
          .from('case_messages')
          .insert([newMsg]);

        if (insertError) {
          console.error(`❌ Error al migrar mensaje ID ${msg.id}:`, insertError.message);
        } else {
          migratedCount++;
        }
      }
      console.log(`✅ [1/2] Migración de mensajes completada: ${migratedCount} de ${oldMessages.length} registros migrados.`);
    }
  } catch (err: any) {
    console.error("❌ Error inesperado durante la migración de 'messages':", err.message);
  }

  // 2) Migración: 'documents' -> 'case_vault_documents'
  console.log("\n📦 [2/2] Verificando migración de 'documents' a 'case_vault_documents'...");
  try {
    const { data: oldDocs, error: oldDocsError } = await supabaseAdmin
      .from('documents')
      .select('*');

    if (oldDocsError) {
      console.warn("⚠️ No se pudo leer la tabla origen 'documents' (probablemente no existe o está vacía):", oldDocsError.message);
    } else if (!oldDocs || oldDocs.length === 0) {
      console.log("ℹ️ No hay registros en la tabla 'documents' para migrar.");
    } else {
      console.log(`Encontrados ${oldDocs.length} registros en 'documents'. Migrando a 'case_vault_documents'...`);
      
      let migratedCount = 0;
      for (const doc of oldDocs) {
        const newDoc = {
          case_id: doc.case_id || doc.user_id,
          user_id: doc.user_id || doc.case_id,
          title: doc.name || doc.title || 'Documento Legal',
          legal_content: doc.content || doc.legal_content || '',
          physical_address: doc.physical_address || '',
          requirements: doc.requirements || [],
          type: doc.type || 'application/pdf',
          url: doc.url || null,
          path: doc.path || null,
          origin: doc.origin || 'generated'
        };

        const { error: insertError } = await supabaseAdmin
          .from('case_vault_documents')
          .insert([newDoc]);

        if (insertError) {
          console.error(`❌ Error al migrar documento ID ${doc.id}:`, insertError.message);
        } else {
          migratedCount++;
        }
      }
      console.log(`✅ [2/2] Migración de documentos de bóveda completada: ${migratedCount} de ${oldDocs.length} registros migrados.`);
    }
  } catch (err: any) {
    console.error("❌ Error inesperado durante la migración de 'documents':", err.message);
  }

  // 3) Verificación de la tabla 'orders' para auditoría financiera
  console.log("\n📦 [3/3] Verificando tabla 'orders' para auditoría de ventas y cupones...");
  try {
    const { data: existingOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, amount_total, payment_method_type, is_real_revenue')
      .limit(10);

    if (ordersError) {
      console.warn("⚠️ Nota: La tabla 'orders' aún no tiene todas las columnas nuevas o no existe. Ejecuta el script SQL 'supabase-orders-migration.sql' en el Editor SQL de Supabase.");
    } else {
      console.log(`✅ Tabla 'orders' accesible en Supabase. Detectados ${existingOrders?.length || 0} registros de prueba/producción.`);
    }
  } catch (ordersErr: any) {
    console.warn("⚠️ Advertencia al verificar 'orders':", ordersErr.message);
  }

  console.log("\n🎉 Proceso de migración finalizado exitosamente.");
}

runMigration().catch((err) => {
  console.error("❌ Error fatal en el script de migración:", err);
  process.exit(1);
});
