export function getDefiniteArticle(countryName: string): string {
  const countriesWithThe = [
    'Bahamas',
    'Central African Republic',
    'Comoros',
    'Czech Republic',
    'Democratic Republic of the Congo',
    'Dominican Republic',
    'Gambia',
    'Maldives',
    'Marshall Islands',
    'Netherlands',
    'Philippines',
    'Republic of the Congo',
    'Seychelles',
    'Solomon Islands',
    'United Arab Emirates',
    'United Kingdom',
    'United States',
    'Vatican City'
  ];

  return countriesWithThe.includes(countryName) ? 'the ' : '';
}
