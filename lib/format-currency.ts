/**
* Formats a number as Ghanaian Cedi currency
* @param amount The amount to format
* @param options Formatting options
* @returns Formatted currency string
*/
export function formatCurrency(
 amount: number,
 options: {
   includeCurrencySymbol?: boolean
   decimalPlaces?: number
 } = {},
): string {
 const { includeCurrencySymbol = true, decimalPlaces = 2 } = options

 // Format the number with the specified decimal places
 const formattedAmount = amount.toFixed(decimalPlaces)

 // Add the currency symbol if requested
 return includeCurrencySymbol ? `GH₵${formattedAmount}` : formattedAmount
}
