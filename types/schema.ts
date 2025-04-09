// Existing types
export interface User {
 id: string
 name: string
 email: string
 phone: string
 role: "user" | "admin"
 password_hash: string
 verified: boolean
 mfa_enabled: boolean
 created_at: Date
 updated_at: Date
}

export interface Wallet {
 id: string
 user_id: string
 network: string
 phone_number: string
 balance: number
 status: "active" | "inactive" | "suspended"
 created_at: Date
 updated_at: Date
}

export interface Transaction {
 id: string
 user_id: string
 wallet_id: string
 type: "send" | "receive"
 amount: number
 fee: number
 network: string
 recipient?: string
 sender?: string
 reference: string
 status: "pending" | "completed" | "failed"
 created_at: Date
 updated_at: Date
}

export interface Contact {
 id: string
 user_id: string
 name: string
 phone_number: string
 network: string
 favorite: boolean
 last_transaction_date: Date
 created_at: Date
 updated_at: Date
}

export interface Notification {
 id: string
 user_id: string
 title: string
 message: string
 type: "transaction" | "security" | "promotion"
 is_read: boolean
 created_at: Date
 updated_at: Date
}

export interface ActivityLog {
 id: string
 user_id: string
 action: string
 details: string
 ip_address: string
 device: string
 created_at: Date
 updated_at: Date
}

// New types for bill payments
export interface BillProvider {
 id: string
 name: string
 provider_code: string
 category: string
 logo_url: string | null
 status: "active" | "inactive"
 created_at: Date
 updated_at: Date
}

export interface BillPayment {
 id: string
 user_id: string
 wallet_id: string
 provider_id: string
 account_number: string
 amount: number
 fee: number
 reference: string
 status: "pending" | "completed" | "failed"
 receipt_url: string | null
 created_at: Date
 updated_at: Date
 // Joined fields
 provider_name?: string
 provider_category?: string
 wallet_network?: string
}

export interface SavedBill {
 id: string
 user_id: string
 provider_id: string
 account_number: string
 account_name: string | null
 is_favorite: boolean
 last_payment_date: Date | null
 created_at: Date
 updated_at: Date
 // Joined fields
 provider_name?: string
 provider_category?: string
}

// New types for bank transfers
export interface Bank {
 id: string
 name: string
 bank_code: string
 logo_url: string | null
 status: "active" | "inactive"
 created_at: Date
 updated_at: Date
}

export interface BankTransfer {
 id: string
 user_id: string
 wallet_id: string
 bank_id: string
 account_number: string
 account_name: string
 amount: number
 fee: number
 reference: string
 narration: string | null
 status: "pending" | "completed" | "failed"
 created_at: Date
 updated_at: Date
 // Joined fields
 bank_name?: string
 wallet_network?: string
}

export interface SavedBankAccount {
 id: string
 user_id: string
 bank_id: string
 account_number: string
 account_name: string
 is_favorite: boolean
 last_transfer_date: Date | null
 created_at: Date
 updated_at: Date
 // Joined fields
 bank_name?: string
}
