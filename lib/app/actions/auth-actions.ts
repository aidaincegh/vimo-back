"use server"

import { cookies } from "next/headers"
import {
 signIn as authServiceSignIn,
 verifyUserCredentials as authServiceVerifyUserCredentials,
} from "@/lib/auth-service"
import type { User } from "@/types/schema"

export async function signIn(email: string, password: string): Promise<{ user: User | null; error?: string }> {
 try {
   // Call the auth service function
   const result = await authServiceSignIn(email, password)

   // If login is successful, set the user ID cookie
   if (result.user) {
     cookies().set("userId", result.user.id, {
       httpOnly: true,
       secure: process.env.NODE_ENV === "production",
       maxAge: 60 * 60 * 24 * 7, // 1 week
       path: "/",
     })
   }

   return result
 } catch (error) {
   console.error("Server action login error:", error)
   return { user: null, error: "An error occurred during login" }
 }
}

export async function verifyUserCredentials(email: string): Promise<{ exists: boolean; passwordHash?: string }> {
 return authServiceVerifyUserCredentials(email)
}

export async function signOut(): Promise<void> {
 cookies().delete("userId")
}
