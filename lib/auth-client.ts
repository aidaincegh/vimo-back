"use client"

// Client-side auth utilities that don't use cookies
export function isAuthenticated(user: any) {
 return !!user
}

export function isAdmin(user: any) {
 return user?.role === "admin"
}
