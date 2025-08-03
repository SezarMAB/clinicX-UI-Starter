import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';

export function debugInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  console.log('Debug Interceptor - Outgoing request:', req.method, req.url);

  return next(req).pipe(
    tap({
      next: (event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          console.log('Debug Interceptor - Response received:', {
            url: req.url,
            status: event.status,
            body: event.body,
          });
        }
      },
      error: error => {
        console.error('Debug Interceptor - Request failed:', {
          url: req.url,
          error,
        });
      },
    })
  );
}
