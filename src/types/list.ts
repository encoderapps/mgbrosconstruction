/** A page of an account's records (invoices, purchase orders) plus the count the API reports. */
export interface AccountListResult<Item> {
  items: Item[];
  /** The count reported by the API, or null until loaded. */
  count: number | null;
}
