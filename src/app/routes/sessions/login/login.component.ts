import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { MtxButtonModule } from '@ng-matero/extensions/button';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { AuthService, TenantService } from '@core/authentication';
import { environment } from '@env/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatIconModule,
    MtxButtonModule,
    TranslateModule,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly tenantService = inject(TenantService);
  private readonly toast = inject(ToastrService);

  isSubmitting = false;
  usePasswordGrant = true; // Toggle between password grant and redirect flow
  clinicName = this.tenantService.clinicName();
  subdomain = this.tenantService.subdomain();

  loginForm = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  get username() {
    return this.loginForm.get('username')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  get rememberMe() {
    return this.loginForm.get('rememberMe')!;
  }

  login() {
    if (this.usePasswordGrant) {
      this.loginWithPassword();
    } else {
      this.loginWithKeycloak();
    }
  }

  private loginWithPassword() {
    this.isSubmitting = true;

    this.auth
      .login(this.username.value, this.password.value, this.rememberMe.value)
      .pipe(filter(authenticated => authenticated))
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/');
        },
        error: (errorRes: HttpErrorResponse) => {
          this.handleLoginError(errorRes);
          this.isSubmitting = false;
        },
      });
  }

  async loginWithKeycloak() {
    try {
      // Store the intended route
      const intendedRoute = sessionStorage.getItem('intendedRoute') || '/';
      await this.auth.loginWithRedirect(window.location.origin + '/auth/callback');
    } catch (error) {
      console.error('Keycloak login error:', error);
      this.toast.error('Failed to initiate Keycloak login');
    }
  }

  private handleLoginError(errorRes: HttpErrorResponse) {
    if (errorRes.status === 422) {
      const form = this.loginForm;
      const errors = errorRes.error.errors;
      Object.keys(errors).forEach(key => {
        form.get(key === 'email' ? 'username' : key)?.setErrors({
          remote: errors[key][0],
        });
      });
    } else if (errorRes.status === 401) {
      this.toast.error('Invalid username or password');
    } else if (errorRes.status === 403) {
      this.toast.error('Access denied. Please check your permissions.');
    } else {
      this.toast.error('Login failed. Please try again.');
    }
  }
}
