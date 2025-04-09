"use server"

import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { addActivityLog } from "./data-service"
import type { User } from "@/types/schema"
import { sql } from "./db"

const sqlNeon = neon(process.env.DATABASE_URL!)

// Server-side function to get the current user
export async function getCurrentUser() {
 try {
   // For demo purposes, we'll just get the first user
   // In a real app, you would get the user ID from the session/cookie
   const userResult = await sql`SELECT id, name, email, phone, role FROM users LIMIT 1`

   if (userResult.length === 0) {
     return null
   }

   return userResult[0]
 } catch (error) {
   console.error("Error getting current user:", error)
   return null
 }
}

export async function signIn(email: string, password: string): Promise<{ user: User | null; error?: string }> {
 try {
   console.log(`Attempting to sign in user: ${email}`)

   // Get user by email
   const users = await sqlNeon<User[]>`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `

   console.log(`Found ${users.length} users with email: ${email}`)

   if (users.length === 0) {
     console.log(`No user found with email: ${email}`)

     // Log failed login attempt with unknown user
     try {
       await addActivityLog(
         "unknown", // Use placeholder for unknown user
         "LOGIN_FAILED",
         `Login attempt with email: ${email} - User not found`,
         "",
         "Web browser",
       )
     } catch (logError) {
       console.error("Failed to log activity:", logError)
     }

     return { user: null, error: "User not found" }
   }

   const user = users[0]
   console.log(`User found: ${user.name} (${user.id})`)

   // For debugging, log the stored password hash (be careful with this in production)
   console.log(`Stored password hash: ${user.password_hash.substring(0, 10)}...`)

   try {
     // Verify password
     console.log(`Comparing provided password with stored hash`)
     const passwordMatch = await bcrypt.compare(password, user.password_hash)

     console.log(`Password match result: ${passwordMatch}`)

     if (!passwordMatch) {
       console.log(`Password does not match for user: ${email}`)

       // Log failed login attempt with known user
       try {
         await addActivityLog(user.id, "LOGIN_FAILED", `Failed login attempt - Invalid password`, "", "Web browser")
       } catch (logError) {
         console.error("Failed to log activity:", logError)
       }

       return { user: null, error: "Invalid password" }
     }
   } catch (bcryptError) {
     console.error(`bcrypt error during password comparison:`, bcryptError)
     return { user: null, error: "Error verifying password" }
   }

   // Set user ID in cookie
   cookies().set("userId", user.id, {
     httpOnly: true,
     secure: process.env.NODE_ENV === "production",
     maxAge: 60 * 60 * 24 * 7, // 1 week
     path: "/",
   })

   // Log successful login
   try {
     await addActivityLog(
       user.id,
       "LOGIN",
       "Successful login",
       "", // IP address would be captured server-side
       "Web browser", // Simplified device info
     )
     console.log(`Successfully logged activity for user: ${user.id}`)
   } catch (logError) {
     console.error("Failed to log activity:", logError)
     // Continue with login even if logging fails
   }

   console.log(`Login successful for user: ${email}`)
   return { user }
 } catch (error) {
   console.error("Login error:", error)
   return { user: null, error: "Database error during login" }
 }
}

// Let's add a function to verify if a user exists and check their password hash
export async function verifyUserCredentials(email: string): Promise<{ exists: boolean; passwordHash?: string }> {
 try {
   const users = await sqlNeon<User[]>`
     SELECT id, email, password_hash FROM users WHERE email = ${email} LIMIT 1
   `

   if (users.length === 0) {
     return { exists: false }
   }

   return {
     exists: true,
     passwordHash: users[0].password_hash,
   }
 } catch (error) {
   console.error("Error verifying user credentials:", error)
   return { exists: false }
 }
}

export async function signUp(name: string, email: string, phone: string, password: string): Promise<User | null> {
 try {
   // Check if user already exists
   const existingUsers = await sqlNeon<User[]>`
     SELECT * FROM users WHERE email = ${email} LIMIT 1
   `

   if (existingUsers.length > 0) {
     return null
   }

   // Hash password
   const passwordHash = await bcrypt.hash(password, 10)

   // Create user
   const newUsers = await sqlNeon<User[]>`
     INSERT INTO users (
       name, 
       email, 
       phone, 
       role, 
       password_hash, 
       verified, 
       mfa_enabled
     ) VALUES (
       ${name}, 
       ${email}, 
       ${phone}, 
       'user', 
       ${passwordHash}, 
       false, 
       false
     )
     RETURNING *
   `

   const newUser = newUsers[0]

   // Log signup
   try {
     await addActivityLog(
       newUser.id,
       "SIGNUP",
       "User registration",
       "", // IP address would be captured server-side
       "Web browser", // Simplified device info
     )
   } catch (error) {
     console.error("Failed to log activity:", error)
     // Continue with signup even if logging fails
   }

   return newUser
 } catch (error) {
   console.error("Signup error:", error)
   return null
 }
}

export async function signOut(): Promise<void> {
 // Clear the user ID cookie
 cookies().delete("userId")
}
