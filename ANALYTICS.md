# Google Analytics Setup

This application is instrumented with Google Analytics 4 to track standard web metrics.

## What's Tracked

### Automatic Tracking
- **Page Views**: All navigation between sections
- **Web Vitals**: Core performance metrics
  - CLS (Cumulative Layout Shift)
  - INP (Interaction to Next Paint)
  - FCP (First Contentful Paint)
  - LCP (Largest Contentful Paint)
  - TTFB (Time to First Byte)

### Custom Events
- Navigation actions (enter tracker, back to home)
- Parliament selector interactions
- Section changes
- User interactions

## Setup Instructions

### 1. Create Google Analytics 4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property
3. Set up a Web data stream
4. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Configure Your Application

Update your `.env` file:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

### 3. Deploy to GCP

When deploying to Google Cloud Platform, set the environment variable:

#### Cloud Run
```bash
gcloud run deploy oireachtas-tracker \
  --image gcr.io/YOUR_PROJECT_ID/oireachtas-tracker \
  --set-env-vars="VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX"
```

#### Cloud Run with Secret Manager (Recommended)
```bash
# Create secret
echo -n "G-XXXXXXXXXX" | gcloud secrets create ga-measurement-id --data-file=-

# Deploy with secret
gcloud run deploy oireachtas-tracker \
  --image gcr.io/YOUR_PROJECT_ID/oireachtas-tracker \
  --set-secrets="VITE_GA_MEASUREMENT_ID=ga-measurement-id:latest"
```

### 4. Verify Setup

1. Deploy your application
2. Visit your site
3. Open Google Analytics Real-Time view
4. You should see your visit appearing in real-time
5. Check Web Vitals in the "Events" section

## Viewing Analytics

### In Google Analytics Console

1. **Real-Time**: Monitor live traffic
2. **Reports > Engagement > Events**: View all custom events
3. **Reports > Engagement > Pages**: See page view data
4. **Reports > User > Tech**: Web Vitals data

### Key Metrics to Watch

- **User Engagement**: Time on site, pages per session
- **Core Web Vitals**: LCP < 2.5s, INP < 200ms, CLS < 0.1
- **Custom Events**: Track user behavior patterns
- **Traffic Sources**: Where users come from

## Data Privacy

The implementation:
- Uses `send_page_view: false` to manually control page tracking
- Tracks anonymized user data
- Complies with GA4's privacy standards
- Does not track personally identifiable information (PII)

Make sure to update your privacy policy to reflect Google Analytics usage.
