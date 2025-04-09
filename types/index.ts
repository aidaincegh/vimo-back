export interface User {
 id: string
 name: string
 email: string
 phone?: string
 role: string
 verified: boolean
 mfa_enabled: boolean
 created_at: string
 updated_at: string
}

export interface Wallet {
 id: string
 user_id: string
 network: string
 phone_number: string
 balance: string
 is_primary: boolean
 created_at: string
 updated_at: string
}

export interface Transaction {
 id: string
 user_id: string
 wallet_id: string
 type: "cash_in" | "cash_out" | "send_money" | "bill_payment" | "airtime"
 amount: string
 fee: string
 recipient_name?: string
 recipient_number?: string
 reference: string
 description?: string
 status: "pending" | "completed" | "failed"
 created_at: string
 updated_at: string
}

export interface Contact {
 id: string
 user_id: string
 name: string
 phone_number: string
 network?: string
 is_favorite: boolean
 last_transaction_date?: string
 created_at: string
 updated_at: string
}

export interface BillProvider {
 id: string
 name: string
 provider_code: string
 category: string
 logo_url?: string
 is_active: boolean
 created_at: string
 updated_at: string
}

export interface BillPayment {
 id: string
 user_id: string
 wallet_id: string
 provider_id: string
 account_number: string
 account_name: string
 amount: string
 fee: string
 reference: string
 status: "pending" | "completed" | "failed"
 created_at: string
 updated_at: string
}

export interface Bank {
 id: string
 name: string
 bank_code: string
 logo_url?: string
 is_active: boolean
 created_at: string
 updated_at: string
}

export interface BankTransfer {
 id: string
 user_id: string
 wallet_id: string
 bank_id: string
 account_number: string
 account_name: string
 amount: string
 fee: string
 reference: string
 narration?: string
 status: "pending" | "completed" | "failed"
 created_at: string
 updated_at: string
}
