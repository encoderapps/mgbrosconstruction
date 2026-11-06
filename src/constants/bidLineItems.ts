/**
 * The Approximate Operating Time Type picklist on a bid line item
 * (MyBid_Item__c.Approximate_Operating_Time_Type__c): Salesforce's value → its label.
 */
export const OPERATING_TIME_TYPE_LABELS: Record<string, string> = {
  Day_s: 'Day/s',
  Week_s: 'Week/s',
  Month_s: 'Month/s',
};

export const OPERATING_TIME_TYPES = Object.keys(OPERATING_TIME_TYPE_LABELS);

export const DEFAULT_OPERATING_TIME_TYPE = 'Day_s';

/** "Day_s" → "Day/s"; an unknown value is shown as it is. */
export function formatOperatingTimeType(value: string): string {
  return OPERATING_TIME_TYPE_LABELS[value] ?? value;
}
