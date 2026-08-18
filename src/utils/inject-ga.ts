export function injectGoogleAnalytics() {
  const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_ID || 'G-Z8N323380M';

  // Load Google Analytics asynchronously without blocking page render
  setTimeout(() => {
    try {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}');
      `;
      document.head.appendChild(script2);
    } catch (error) {
      console.warn('Google Analytics failed to load:', error);
    }
  }, 100); // Small delay to not block initial render
}
