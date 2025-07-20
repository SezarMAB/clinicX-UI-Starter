# Text Compression Configuration

This project is configured to support text compression for optimal performance. Below are the different server configurations available:

## 1. Express Server (Node.js) - Default

The project includes an Express server with compression middleware configured:

```bash
# Build production and serve with compression
npm run serve:prod
```

This will:
- Build the Angular app for production
- Start an Express server on port 4200 with gzip compression enabled

## 2. Nginx Configuration

If deploying to Nginx, use the provided `nginx.conf` file:
- Gzip compression enabled for text files
- Proper cache headers configured
- Angular routing support included

## 3. Apache Configuration

If deploying to Apache, the `.htaccess` file includes:
- mod_deflate compression settings
- Cache control headers
- Angular routing support

## Build Size Optimization

The Angular build is configured with:
- Production optimizations (minification, tree-shaking)
- Lazy loading for route modules
- Budget limits to prevent bloated bundles

## Compression Benefits

- **HTML/CSS/JS**: ~60-80% size reduction
- **JSON**: ~80-90% size reduction
- **SVG**: ~50-70% size reduction

## Verifying Compression

To verify compression is working:
1. Open browser DevTools
2. Go to Network tab
3. Check Response Headers for `Content-Encoding: gzip`
4. Compare Size vs Transferred columns

## Additional Optimizations

1. **Images**: Consider using WebP format
2. **Fonts**: Already configured for efficient loading
3. **Bundle Analysis**: Run `npm run analyze` to identify large dependencies