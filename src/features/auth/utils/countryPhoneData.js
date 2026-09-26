// Country phone data with exact lengths (excluding country code)
export const countryPhoneData = [
  { code: "+1", maxLength: 10 },      // US/Canada
  { code: "+7", maxLength: 10 },      // Russia
  { code: "+33", maxLength: 9 },      // France
  { code: "+34", maxLength: 9 },      // Spain
  { code: "+39", maxLength: 10 },     // Italy
  { code: "+44", maxLength: 10 },     // UK
  { code: "+49", maxLength: 11 },     // Germany
  { code: "+52", maxLength: 10 },     // Mexico
  { code: "+55", maxLength: 11 },     // Brazil
  { code: "+60", maxLength: 10 },     // Malaysia
  { code: "+61", maxLength: 9 },      // Australia
  { code: "+62", maxLength: 11 },     // Indonesia
  { code: "+63", maxLength: 10 },     // Philippines
  { code: "+65", maxLength: 8 },      // Singapore
  { code: "+66", maxLength: 9 },      // Thailand
  { code: "+81", maxLength: 10 },     // Japan
  { code: "+82", maxLength: 10 },     // South Korea
  { code: "+86", maxLength: 11 },     // China
  { code: "+91", maxLength: 10 },     // India
  { code: "+971", maxLength: 9 },     // UAE
];

export const getMaxLengthForCountry = (countryCode) => {
  const country = countryPhoneData.find(c => c.code === countryCode);
  return country ? country.maxLength : 15; // Default to 15 if not found
};