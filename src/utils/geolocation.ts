export interface GeolocationData {
  country: string;
  countryCode: string;
}

export async function detectCountryFromIP(): Promise<GeolocationData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch geolocation data');
    }

    const data = await response.json();

    return {
      country: data.country_name || '',
      countryCode: data.country_code || '',
    };
  } catch (error) {
    console.error('Error detecting country from IP:', error);
    return null;
  }
}
