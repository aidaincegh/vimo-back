import { neon } from "@neondatabase/serverless"

// Initialize Neon SQL client
export const sql = neon(process.env.DATABASE_URL!)

// Helper function for raw SQL queries
export async function executeQuery(query: string, params: any[] = []) {
 try {
   return await sql(query, params)
 } catch (error) {
   console.error("Database query error:", error)
   throw error
 }
}

export function formatContact(contact: any) {
 return {
   id: contact.id,
   user_id: contact.user_id,
   name: contact.name,
   phone_number: contact.phone_number,
   network: contact.network,
   favorite: contact.favorite,
   last_transaction_date: contact.last_transaction_date,
   created_at: contact.created_at,
   updated_at: contact.updated_at,
 }
}
