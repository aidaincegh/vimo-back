import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
 try {
   // Hash the password "password123"
   const passwordHash = await bcrypt.hash("password123", 10)

   // Update the password for john@example.com
   const result = await sql`
     UPDATE users 
     SET password_hash = ${passwordHash}
     WHERE email = 'john@example.com'
     RETURNING id, email
   `

   if (result.length === 0) {
     return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
   }

   return NextResponse.json({
     success: true,
     message: "Password reset successfully",
     user: { id: result[0].id, email: result[0].email },
     passwordHashPrefix: passwordHash.substring(0, 10),
   })
 } catch (error) {
   console.error("Error resetting password:", error)
   return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
 }
}
