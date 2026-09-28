// Salesforce "Tax Classification" restricted picklist. Each value is identical
// to its API name, so the selected label is sent to the API as-is — any other
// value is rejected by Salesforce with a 400 "bad value for restricted picklist".
export const TAX_CLASSIFICATION_OPTIONS = ['LLC', 'Corporation'];
