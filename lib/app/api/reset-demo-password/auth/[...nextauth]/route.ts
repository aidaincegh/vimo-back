import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { executeQuery } from "@/lib/db"

const handler = NextAuth({
 providers: [
   CredentialsProvider({
     name: "Credentials",
     credentials: {
       email: { label: "Email", type: "email" },
       password: { label: "Password", type: "password" },
     },
     async authorize(credentials) {
       if (!credentials?.email || !credentials?.password) {
         return null
       }

       try {
         // Find user by email
         const users = await executeQuery("SELECT id, name, email, password_hash, role FROM users WHERE email = $1", [
           credentials.email,
         ])

         const user = users[0]

         if (!user) {
           return null
         }

         // Compare password
         const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash)

         if (!passwordMatch) {
           return null
         }

         return {
           id: user.id,
           name: user.name,
           email: user.email,
           role: user.role,
         }
       } catch (error) {
         console.error("Authentication error:", error)
         return null
       }
     },
   }),
 ],
 callbacks: {
   async jwt({ token, user }) {
     if (user) {
       token.id = user.id
       token.role = user.role
     }
     return token
   },
   async session({ session, token }) {
     if (session.user) {
       session.user.id = token.id as string
       session.user.role = token.role as string
     }
     return session
   },
 },
 pages: {
   signIn: "/login",
 },
 session: {
   strategy: "jwt",
 },
})

export { handler as GET, handler as POST }
