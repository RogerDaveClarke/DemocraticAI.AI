function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) throw new Error(`Missing required tenant configuration: ${name}`);
  return value;
}

export const API_URL = required('VITE_API_URL').replace(/\/$/, '');
export const API_KEY = required('VITE_API_KEY');
