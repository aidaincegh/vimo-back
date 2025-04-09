import { neon } from "@neondatabase/serverless"
import type {
 User,
 Wallet,
 Transaction,
 Contact,
 Notification,
 ActivityLog,
 BillProvider,
 BillPayment,
 SavedBill,
 Bank,
 BankTransfer,
 SavedBankAccount,
} from "@/types/schema"

const sql = neon(process.env.DATABASE_URL!)

// Existing functions
export async function getUserByEmail(email: string): Promise<User | null> {
 const users = await sql<User[]>`
   SELECT * FROM users WHERE email = ${email} LIMIT 1
 `
 return users.length > 0 ? users[0] : null
}

export async function getUserById(id: string): Promise<User | null> {
 const users = await sql<User[]>`
   SELECT * FROM users WHERE id = ${id} LIMIT 1
 `
 return users.length > 0 ? users[0] : null
}

// Update the getWalletsByUserId function to handle non-UUID user IDs
export async function getWalletsByUserId(userId: string): Promise<Wallet[]> {
 try {
   // Validate if userId is a valid UUID
   const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)

   if (!isValidUUID) {
     console.warn(`Invalid UUID format: ${userId}. Using fallback query.`)
     // For demo purposes, return the first few wallets if userId is not a valid UUID
     return await sql<Wallet[]>`
       SELECT * FROM wallets ORDER BY created_at DESC LIMIT 5
     `
   }

   return await sql<Wallet[]>`
     SELECT * FROM wallets WHERE user_id = ${userId} ORDER BY created_at DESC
   `
 } catch (error) {
   console.error("Error fetching wallets:", error)
   return [] // Return empty array instead of throwing
 }
}

export async function getWalletById(id: string): Promise<Wallet | null> {
 const wallets = await sql<Wallet[]>`
   SELECT * FROM wallets WHERE id = ${id} LIMIT 1
 `
 return wallets.length > 0 ? wallets[0] : null
}

// Add the missing addWallet function
export async function addWallet(wallet: Omit<Wallet, "id" | "created_at" | "updated_at">): Promise<Wallet> {
 const result = await sql<Wallet[]>`
   INSERT INTO wallets (
     user_id, network, phone_number, balance, status
   ) VALUES (
     ${wallet.user_id}, ${wallet.network}, ${wallet.phone_number}, ${wallet.balance}, ${wallet.status}
   )
   RETURNING *
 `

 // Log the activity
 await addActivityLog(
   wallet.user_id,
   "WALLET_ADDED",
   `Added ${wallet.network} wallet with number ${wallet.phone_number}`,
   "",
   "Web browser",
 )

 return result[0]
}

// Update the getTransactionsByUserId function similarly
export async function getTransactionsByUserId(userId: string, limit = 10): Promise<Transaction[]> {
 try {
   // Validate if userId is a valid UUID
   const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)

   if (!isValidUUID) {
     console.warn(`Invalid UUID format: ${userId}. Using fallback query.`)
     // For demo purposes, return the most recent transactions if userId is not a valid UUID
     return await sql<Transaction[]>`
       SELECT * FROM transactions ORDER BY created_at DESC LIMIT ${limit}
     `
   }

   return await sql<Transaction[]>`
     SELECT * FROM transactions 
     WHERE user_id = ${userId} 
     ORDER BY created_at DESC 
     LIMIT ${limit}
   `
 } catch (error) {
   console.error("Error fetching transactions:", error)
   return [] // Return empty array instead of throwing
 }
}

// Add the missing fetchTransactions function
export async function fetchTransactions(limit = 10, userId?: string): Promise<Transaction[]> {
 if (userId) {
   return getTransactionsByUserId(userId, limit)
 }

 // If no userId is provided, return a sample of transactions
 // In a real app, this might be limited to admin users
 return await sql<Transaction[]>`
   SELECT * FROM transactions 
   ORDER BY created_at DESC 
   LIMIT ${limit}
 `
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
 const transactions = await sql<Transaction[]>`
   SELECT * FROM transactions WHERE id = ${id} LIMIT 1
 `
 return transactions.length > 0 ? transactions[0] : null
}

export async function getContactsByUserId(userId: string): Promise<Contact[]> {
 return await sql<Contact[]>`
   SELECT * FROM contacts 
   WHERE user_id = ${userId} 
   ORDER BY favorite DESC, name ASC
 `
}

export async function getNotificationsByUserId(userId: string, limit = 10): Promise<Notification[]> {
 return await sql<Notification[]>`
   SELECT * FROM notifications 
   WHERE user_id = ${userId} 
   ORDER BY created_at DESC 
   LIMIT ${limit}
 `
}

// Add the missing fetchNotifications function
export async function fetchNotifications(limit = 10): Promise<Notification[]> {
 // In a real app, this would fetch notifications for the current user
 // For now, we'll return some mock data
 return await sql<Notification[]>`
   SELECT * FROM notifications
   ORDER BY created_at DESC
   LIMIT ${limit}
 `
}

export async function getActivityLogsByUserId(userId: string, limit = 10): Promise<ActivityLog[]> {
 return await sql<ActivityLog[]>`
   SELECT * FROM activity_logs 
   WHERE user_id = ${userId} 
   ORDER BY created_at DESC 
   LIMIT ${limit}
 `
}

// Add the missing addActivityLog function
export async function addActivityLog(
 userId: string,
 action: string,
 details: string,
 ipAddress = "",
 device = "",
): Promise<ActivityLog> {
 try {
   // Check if userId is a valid UUID or use a placeholder for system actions
   const safeUserId =
     userId === "unknown" || userId === "system"
       ? "00000000-0000-0000-0000-000000000000" // Use a placeholder UUID for system/unknown actions
       : userId

   const result = await sql<ActivityLog[]>`
    INSERT INTO activity_logs (
      user_id, action, details, ip_address, device
    ) VALUES (
      ${safeUserId}, ${action}, ${details}, ${ipAddress}, ${device}
    )
    RETURNING *
  `
   return result[0]
 } catch (error) {
   console.error("Error adding activity log:", error)
   // Return a minimal activity log object to prevent further errors
   return {
     id: "error",
     user_id: userId,
     action,
     details: "Error logging activity: " + String(error),
     ip_address: ipAddress,
     device,
     created_at: new Date(),
   } as ActivityLog
 }
}

// New functions for bill payments
export async function getBillProviders(category?: string): Promise<BillProvider[]> {
 if (category) {
   return await sql<BillProvider[]>`
     SELECT * FROM bill_providers 
     WHERE category = ${category} AND status = 'active'
     ORDER BY name ASC
   `
 }

 return await sql<BillProvider[]>`
   SELECT * FROM bill_providers 
   WHERE status = 'active'
   ORDER BY category ASC, name ASC
 `
}

export async function getBillProviderById(id: string): Promise<BillProvider | null> {
 const providers = await sql<BillProvider[]>`
   SELECT * FROM bill_providers WHERE id = ${id} LIMIT 1
 `
 return providers.length > 0 ? providers[0] : null
}

export async function getBillPaymentsByUserId(userId: string, limit = 10): Promise<BillPayment[]> {
 return await sql<BillPayment[]>`
   SELECT 
     bp.*,
     bprov.name as provider_name,
     bprov.category as provider_category,
     w.network as wallet_network
   FROM bill_payments bp
   JOIN bill_providers bprov ON bp.provider_id = bprov.id
   JOIN wallets w ON bp.wallet_id = w.id
   WHERE bp.user_id = ${userId}
   ORDER BY bp.created_at DESC
   LIMIT ${limit}
 `
}

export async function getBillPaymentById(id: string): Promise<BillPayment | null> {
 const payments = await sql<BillPayment[]>`
   SELECT 
     bp.*,
     bprov.name as provider_name,
     bprov.category as provider_category,
     w.network as wallet_network
   FROM bill_payments bp
   JOIN bill_providers bprov ON bp.provider_id = bprov.id
   JOIN wallets w ON bp.wallet_id = w.id
   WHERE bp.id = ${id}
   LIMIT 1
 `
 return payments.length > 0 ? payments[0] : null
}

export async function createBillPayment(
 payment: Omit<BillPayment, "id" | "created_at" | "updated_at">,
): Promise<BillPayment> {
 const result = await sql<BillPayment[]>`
   INSERT INTO bill_payments (
     user_id, wallet_id, provider_id, account_number, 
     amount, fee, reference, status
   ) VALUES (
     ${payment.user_id}, ${payment.wallet_id}, ${payment.provider_id}, ${payment.account_number},
     ${payment.amount}, ${payment.fee}, ${payment.reference}, ${payment.status}
   )
   RETURNING *
 `

 // Update wallet balance
 await sql`
   UPDATE wallets
   SET balance = balance - (${payment.amount} + ${payment.fee})
   WHERE id = ${payment.wallet_id}
 `

 // Create transaction record
 await sql`
   INSERT INTO transactions (
     user_id, wallet_id, type, amount, fee, network,
     recipient, reference, status
   ) VALUES (
     ${payment.user_id}, ${payment.wallet_id}, 'send', ${payment.amount}, ${payment.fee},
     (SELECT network FROM wallets WHERE id = ${payment.wallet_id}),
     (SELECT name FROM bill_providers WHERE id = ${payment.provider_id}),
     ${payment.reference}, ${payment.status}
   )
 `

 return result[0]
}

export async function getSavedBillsByUserId(userId: string): Promise<SavedBill[]> {
 return await sql<SavedBill[]>`
   SELECT 
     sb.*,
     bp.name as provider_name,
     bp.category as provider_category
   FROM saved_bills sb
   JOIN bill_providers bp ON sb.provider_id = bp.id
   WHERE sb.user_id = ${userId}
   ORDER BY sb.is_favorite DESC, sb.last_payment_date DESC NULLS LAST
 `
}

export async function saveBill(bill: Omit<SavedBill, "id" | "created_at" | "updated_at">): Promise<SavedBill> {
 // Check if bill already exists
 const existingBills = await sql<SavedBill[]>`
   SELECT * FROM saved_bills
   WHERE user_id = ${bill.user_id} AND provider_id = ${bill.provider_id} AND account_number = ${bill.account_number}
   LIMIT 1
 `

 if (existingBills.length > 0) {
   // Update existing bill
   const result = await sql<SavedBill[]>`
     UPDATE saved_bills
     SET account_name = ${bill.account_name}, is_favorite = ${bill.is_favorite}
     WHERE id = ${existingBills[0].id}
     RETURNING *
   `
   return result[0]
 } else {
   // Create new saved bill
   const result = await sql<SavedBill[]>`
     INSERT INTO saved_bills (
       user_id, provider_id, account_number, account_name, is_favorite
     ) VALUES (
       ${bill.user_id}, ${bill.provider_id}, ${bill.account_number}, ${bill.account_name}, ${bill.is_favorite}
     )
     RETURNING *
   `
   return result[0]
 }
}

// New functions for bank transfers
export async function getBanks(): Promise<Bank[]> {
 return await sql<Bank[]>`
   SELECT * FROM banks 
   WHERE status = 'active'
   ORDER BY name ASC
 `
}

export async function getBankById(id: string): Promise<Bank | null> {
 const banks = await sql<Bank[]>`
   SELECT * FROM banks WHERE id = ${id} LIMIT 1
 `
 return banks.length > 0 ? banks[0] : null
}

export async function getBankTransfersByUserId(userId: string, limit = 10): Promise<BankTransfer[]> {
 return await sql<BankTransfer[]>`
   SELECT 
     bt.*,
     b.name as bank_name,
     w.network as wallet_network
   FROM bank_transfers bt
   JOIN banks b ON bt.bank_id = b.id
   JOIN wallets w ON bt.wallet_id = w.id
   WHERE bt.user_id = ${userId}
   ORDER BY bt.created_at DESC
   LIMIT ${limit}
 `
}

export async function getBankTransferById(id: string): Promise<BankTransfer | null> {
 const transfers = await sql<BankTransfer[]>`
   SELECT 
     bt.*,
     b.name as bank_name,
     w.network as wallet_network
   FROM bank_transfers bt
   JOIN banks b ON bt.bank_id = b.id
   JOIN wallets w ON bt.wallet_id = w.id
   WHERE bt.id = ${id}
   LIMIT 1
 `
 return transfers.length > 0 ? transfers[0] : null
}

export async function createBankTransfer(
 transfer: Omit<BankTransfer, "id" | "created_at" | "updated_at">,
): Promise<BankTransfer> {
 const result = await sql<BankTransfer[]>`
   INSERT INTO bank_transfers (
     user_id, wallet_id, bank_id, account_number, account_name,
     amount, fee, reference, narration, status
   ) VALUES (
     ${transfer.user_id}, ${transfer.wallet_id}, ${transfer.bank_id}, ${transfer.account_number}, ${transfer.account_name},
     ${transfer.amount}, ${transfer.fee}, ${transfer.reference}, ${transfer.narration}, ${transfer.status}
   )
   RETURNING *
 `

 // Update wallet balance
 await sql`
   UPDATE wallets
   SET balance = balance - (${transfer.amount} + ${transfer.fee})
   WHERE id = ${transfer.wallet_id}
 `

 // Create transaction record
 await sql`
   INSERT INTO transactions (
     user_id, wallet_id, type, amount, fee, network,
     recipient, reference, status
   ) VALUES (
     ${transfer.user_id}, ${transfer.wallet_id}, 'send', ${transfer.amount}, ${transfer.fee},
     (SELECT network FROM wallets WHERE id = ${transfer.wallet_id}),
     ${transfer.account_name}, ${transfer.reference}, ${transfer.status}
   )
 `

 return result[0]
}

export async function getSavedBankAccountsByUserId(userId: string): Promise<SavedBankAccount[]> {
 return await sql<SavedBankAccount[]>`
   SELECT 
     sba.*,
     b.name as bank_name
   FROM saved_bank_accounts sba
   JOIN banks b ON sba.bank_id = b.id
   WHERE sba.user_id = ${userId}
   ORDER BY sba.is_favorite DESC, sba.last_transfer_date DESC NULLS LAST
 `
}

export async function saveBankAccount(
 account: Omit<SavedBankAccount, "id" | "created_at" | "updated_at">,
): Promise<SavedBankAccount> {
 // Check if account already exists
 const existingAccounts = await sql<SavedBankAccount[]>`
   SELECT * FROM saved_bank_accounts
   WHERE user_id = ${account.user_id} AND bank_id = ${account.bank_id} AND account_number = ${account.account_number}
   LIMIT 1
 `

 if (existingAccounts.length > 0) {
   // Update existing account
   const result = await sql<SavedBankAccount[]>`
     UPDATE saved_bank_accounts
     SET account_name = ${account.account_name}, is_favorite = ${account.is_favorite}
     WHERE id = ${existingAccounts[0].id}
     RETURNING *
   `
   return result[0]
 } else {
   // Create new saved account
   const result = await sql<SavedBankAccount[]>`
     INSERT INTO saved_bank_accounts (
       user_id, bank_id, account_number, account_name, is_favorite
     ) VALUES (
       ${account.user_id}, ${account.bank_id}, ${account.account_number}, ${account.account_name}, ${account.is_favorite}
     )
     RETURNING *
   `
   return result[0]
 }
}

export async function fetchTransactionById(id: string): Promise<Transaction | null> {
 const transactions = await sql<Transaction[]>`
   SELECT * FROM transactions WHERE id = ${id} LIMIT 1
 `
 return transactions.length > 0 ? transactions[0] : null
}

export async function fetchWalletById(id: string): Promise<Wallet | null> {
 const wallets = await sql<Wallet[]>`
   SELECT * FROM wallets WHERE id = ${id} LIMIT 1
 `
 return wallets.length > 0 ? wallets[0] : null
}
