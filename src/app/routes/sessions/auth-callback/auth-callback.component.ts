import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { KeycloakAuthService } from '@core/authentication/keycloak-auth.service';

@Component({
  selector: 'app-auth-callback',
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
  ],
})
export class AuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly keycloakAuth = inject(KeycloakAuthService);
  private readonly toast = inject(ToastrService);

  // Signals for component state
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly errorDetails = signal<string | null>(null);

  ngOnInit(): void {
    this.handleCallback();
  }

  /**
   * Handle the authentication callback from Keycloak
   */
  private handleCallback(): void {
    // Extract parameters from URL
    const queryParams = this.route.snapshot.queryParams;
    const code = queryParams.code;
    const state = queryParams.state;
    const error = queryParams.error;
    const errorDescription = queryParams.error_description;

    // Check for OAuth errors
    if (error) {
      this.handleOAuthError(error, errorDescription);
      return;
    }

    // Validate required authorization code
    if (!code) {
      this.handleError(
        'Missing authorization code',
        'No authorization code was provided in the callback URL.'
      );
      return;
    }

    // Process the authorization code
    this.keycloakAuth.handleAuthCallback(code, state).subscribe({
      next: success => {
        if (success) {
          this.handleSuccess();
        } else {
          this.handleError(
            'Authentication failed',
            this.keycloakAuth.error() || 'Unable to complete authentication process.'
          );
        }
      },
      error: err => {
        console.error('Auth callback error:', err);
        this.handleError(
          'Authentication error',
          err.message || 'An unexpected error occurred during authentication.'
        );
      },
    });
  }

  /**
   * Handle OAuth-specific errors from Keycloak
   */
  private handleOAuthError(error: string, description?: string): void {
    this.loading.set(false);

    const errorMessages: Record<string, string> = {
      access_denied: 'Access was denied. You may not have permission to access this application.',
      unauthorized_client: 'This application is not authorized to use this authentication method.',
      invalid_request: 'The authentication request was invalid.',
      unsupported_response_type: 'The authentication method is not supported.',
      server_error: 'The authentication server encountered an error.',
      temporarily_unavailable: 'The authentication service is temporarily unavailable.',
    };

    const message = errorMessages[error] || 'An authentication error occurred.';
    this.error.set(message);
    this.errorDetails.set(description || `Error code: ${error}`);

    this.toast.error(message);
  }

  /**
   * Handle general errors during the callback process
   */
  private handleError(message: string, details?: string): void {
    this.loading.set(false);
    this.error.set(message);
    this.errorDetails.set(details || null);
    this.toast.error(message);
  }

  /**
   * Handle successful authentication
   */
  private handleSuccess(): void {
    this.loading.set(false);
    this.toast.success('Successfully authenticated!');

    // Get the intended route from session storage or default to dashboard
    const returnUrl = sessionStorage.getItem('auth_return_url') || '/dashboard';
    sessionStorage.removeItem('auth_return_url');

    // Navigate to the intended route
    this.router.navigateByUrl(returnUrl);
  }

  /**
   * Retry authentication
   */
  retry(): void {
    // Clear any existing errors
    this.keycloakAuth.clearError();

    // Get the original return URL if available
    const returnUrl = sessionStorage.getItem('auth_return_url') || '/dashboard';

    // Redirect to login with the return URL
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl },
    });
  }

  /**
   * Navigate to home page
   */
  goHome(): void {
    this.router.navigate(['/']);
  }
}
