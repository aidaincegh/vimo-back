"use server"

import { sql, formatContact } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Add a new contact
export async function addContact(userId: string, name: string, phoneNumber: string, network: string) {
 try {
   // Insert the new contact
   const result = await sql`
     INSERT INTO contacts (id, user_id, name, phone_number, network, favorite, created_at, updated_at)
     VALUES (gen_random_uuid(), ${userId}, ${name}, ${phoneNumber}, ${network}, false, NOW(), NOW())
     RETURNING *
   `

   if (result.length === 0) {
     return { success: false, error: "Failed to add contact" }
   }

   // Format the contact
   const contact = formatContact(result[0])

   // Revalidate the contacts page
   revalidatePath("/dashboard/contacts")

   return { success: true, contact }
 } catch (error) {
   console.error("Error adding contact:", error)
   return { success: false, error: "An error occurred while adding the contact" }
 }
}

// Toggle favorite status
export async function toggleFavorite(contactId: string) {
 try {
   // Get current favorite status
   const currentStatus = await sql`
     SELECT favorite FROM contacts WHERE id = ${contactId}
   `

   if (currentStatus.length === 0) {
     return { success: false, error: "Contact not found" }
   }

   const isFavorite = !currentStatus[0].favorite

   // Update favorite status
   await sql`
     UPDATE contacts 
     SET favorite = ${isFavorite}, updated_at = NOW()
     WHERE id = ${contactId}
   `

   // Revalidate the contacts page
   revalidatePath("/dashboard/contacts")

   return { success: true, favorite: isFavorite }
 } catch (error) {
   console.error("Error toggling favorite:", error)
   return { success: false, error: "An error occurred while updating the contact" }
 }
}

// Delete a contact
export async function deleteContact(contactId: string) {
 try {
   // Delete the contact
   await sql`
     DELETE FROM contacts WHERE id = ${contactId}
   `

   // Revalidate the contacts page
   revalidatePath("/dashboard/contacts")

   return { success: true }
 } catch (error) {
   console.error("Error deleting contact:", error)
   return { success: false, error: "An error occurred while deleting the contact" }
 }
}
