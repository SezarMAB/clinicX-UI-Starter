import {
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  OnInit,
  runInInjectionContext,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  NonNullableFormBuilder,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { SubdomainAvailabilityDto, TenantsService } from '@features';
import { TenantCreateRequest, TenantUpdateRequest, TenantDetailDto } from '@features';
import {
  createSubdomainAvailabilityValidatorLazy,
  subdomainPatternValidator,
} from './validators/subdomain-availability.validator';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpResourceRef } from '@angular/common/http';

interface DialogData {
  mode: 'create' | 'edit';
  tenantId?: string;
}

/**
 * Dialog component for creating or editing tenants
 * Uses reactive forms with validation and async subdomain checking
 */
@Component({
  selector: 'app-tenant-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'create' ? 'Create New Tenant' : 'Edit Tenant' }}
    </h2>

    <mat-dialog-content>
      @if (data.mode === 'create') {
        <mat-stepper #stepper linear>
          <!-- Step 1: Basic Information -->
          <mat-step [stepControl]="basicInfoForm" label="Basic Information">
            <form [formGroup]="basicInfoForm" class="form-step">
              <mat-form-field appearance="outline">
                <mat-label>Tenant Name</mat-label>
                <input matInput formControlName="name" placeholder="Acme Clinic" />
                <mat-icon matSuffix>business</mat-icon>
                @if (basicInfoForm.controls.name.hasError('required')) {
                  <mat-error>Name is required</mat-error>
                }
                @if (basicInfoForm.controls.name.hasError('minlength')) {
                  <mat-error>Name must be at least 3 characters</mat-error>
                }
                @if (basicInfoForm.controls.name.hasError('maxlength')) {
                  <mat-error>Name must not exceed 100 characters</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Subdomain</mat-label>
                <input
                  matInput
                  formControlName="subdomain"
                  placeholder="acme"
                  [readonly]="isProcessing()"
                />
                <mat-icon matSuffix>link</mat-icon>
                <mat-hint>.clinic.com</mat-hint>
                @if (basicInfoForm.controls.subdomain.pending) {
                  <mat-hint align="end">
                    <mat-spinner diameter="16"></mat-spinner>
                    Checking availability...
                  </mat-hint>
                }
                @if (basicInfoForm.controls.subdomain.hasError('required')) {
                  <mat-error>Subdomain is required</mat-error>
                }
                @if (basicInfoForm.controls.subdomain.hasError('pattern')) {
                  <mat-error>Only lowercase letters, numbers, and hyphens allowed</mat-error>
                }
                @if (basicInfoForm.controls.subdomain.hasError('minlength')) {
                  <mat-error>Subdomain must be at least 3 characters</mat-error>
                }
                @if (basicInfoForm.controls.subdomain.hasError('maxlength')) {
                  <mat-error>Subdomain must not exceed 50 characters</mat-error>
                }
                @if (basicInfoForm.controls.subdomain.hasError('unavailable')) {
                  <mat-error>This subdomain is already taken</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Specialty</mat-label>
                <mat-select formControlName="specialty">
                  <mat-option value="CLINIC">Clinic</mat-option>
                  <mat-option value="DENTAL">Dental</mat-option>
                  <mat-option value="APPOINTMENTS">Appointments</mat-option>
                  <mat-option value="CHRORG">Chronic Care</mat-option>
                </mat-select>
                <mat-icon matSuffix>medical_services</mat-icon>
              </mat-form-field>

              <div class="step-actions">
                <button
                  mat-button
                  matStepperNext
                  [disabled]="basicInfoForm.invalid || basicInfoForm.pending"
                >
                  Next
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Step 2: Contact Information -->
          <mat-step [stepControl]="contactForm" label="Contact Information">
            <form [formGroup]="contactForm" class="form-step">
              <mat-form-field appearance="outline">
                <mat-label>Contact Email</mat-label>
                <input matInput formControlName="contactEmail" type="email" />
                <mat-icon matSuffix>email</mat-icon>
                @if (contactForm.controls.contactEmail.hasError('required')) {
                  <mat-error>Email is required</mat-error>
                }
                @if (contactForm.controls.contactEmail.hasError('email')) {
                  <mat-error>Invalid email format</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Contact Phone</mat-label>
                <input matInput formControlName="contactPhone" placeholder="+1 234 567 8900" />
                <mat-icon matSuffix>phone</mat-icon>
                @if (contactForm.controls.contactPhone.hasError('pattern')) {
                  <mat-error>Invalid phone number format</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Address</mat-label>
                <textarea matInput formControlName="address" rows="3"></textarea>
                <mat-icon matSuffix>location_on</mat-icon>
              </mat-form-field>

              <div class="step-actions">
                <button mat-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon>
                  Previous
                </button>
                <button mat-button matStepperNext [disabled]="contactForm.invalid">
                  Next
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Step 3: Subscription -->
          <mat-step [stepControl]="subscriptionForm" label="Subscription">
            <form [formGroup]="subscriptionForm" class="form-step">
              <mat-form-field appearance="outline">
                <mat-label>Subscription Plan</mat-label>
                <mat-select formControlName="subscriptionPlan">
                  <mat-option value="BASIC">Basic</mat-option>
                  <mat-option value="STANDARD">Standard</mat-option>
                  <mat-option value="PREMIUM">Premium</mat-option>
                  <mat-option value="ENTERPRISE">Enterprise</mat-option>
                </mat-select>
                <mat-icon matSuffix>payments</mat-icon>
              </mat-form-field>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Max Users</mat-label>
                  <input matInput formControlName="maxUsers" type="number" min="1" />
                  <mat-icon matSuffix>group</mat-icon>
                  @if (subscriptionForm.controls.maxUsers.hasError('required')) {
                    <mat-error>Max users is required</mat-error>
                  }
                  @if (subscriptionForm.controls.maxUsers.hasError('min')) {
                    <mat-error>Must be at least 1</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Max Patients</mat-label>
                  <input matInput formControlName="maxPatients" type="number" min="1" />
                  <mat-icon matSuffix>folder_shared</mat-icon>
                  @if (subscriptionForm.controls.maxPatients.hasError('required')) {
                    <mat-error>Max patients is required</mat-error>
                  }
                  @if (subscriptionForm.controls.maxPatients.hasError('min')) {
                    <mat-error>Must be at least 1</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="step-actions">
                <button mat-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon>
                  Previous
                </button>
                <button mat-button matStepperNext [disabled]="subscriptionForm.invalid">
                  Next
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Step 4: Admin User -->
          <mat-step [stepControl]="adminForm" label="Admin User">
            <form [formGroup]="adminForm" class="form-step">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>First Name</mat-label>
                  <input matInput formControlName="adminFirstName" />
                  <mat-icon matSuffix>person</mat-icon>
                  @if (adminForm.controls.adminFirstName.hasError('required')) {
                    <mat-error>First name is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Last Name</mat-label>
                  <input matInput formControlName="adminLastName" />
                  @if (adminForm.controls.adminLastName.hasError('required')) {
                    <mat-error>Last name is required</mat-error>
                  }
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline">
                <mat-label>Admin Username</mat-label>
                <input matInput formControlName="adminUsername" />
                <mat-icon matSuffix>account_circle</mat-icon>
                @if (adminForm.controls.adminUsername.hasError('required')) {
                  <mat-error>Username is required</mat-error>
                }
                @if (adminForm.controls.adminUsername.hasError('minlength')) {
                  <mat-error>Username must be at least 3 characters</mat-error>
                }
                @if (adminForm.controls.adminUsername.hasError('maxlength')) {
                  <mat-error>Username must not exceed 50 characters</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Admin Email</mat-label>
                <input matInput formControlName="adminEmail" type="email" />
                <mat-icon matSuffix>email</mat-icon>
                @if (adminForm.controls.adminEmail.hasError('required')) {
                  <mat-error>Email is required</mat-error>
                }
                @if (adminForm.controls.adminEmail.hasError('email')) {
                  <mat-error>Invalid email format</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Admin Password</mat-label>
                <input
                  matInput
                  formControlName="adminPassword"
                  [type]="showPassword() ? 'text' : 'password'"
                />
                <button
                  mat-icon-button
                  matSuffix
                  (click)="showPassword.set(!showPassword())"
                  type="button"
                >
                  <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (adminForm.controls.adminPassword.hasError('required')) {
                  <mat-error>Password is required</mat-error>
                }
                @if (adminForm.controls.adminPassword.hasError('minlength')) {
                  <mat-error>Password must be at least 8 characters</mat-error>
                }
              </mat-form-field>

              <div class="step-actions">
                <button mat-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon>
                  Previous
                </button>
                <button
                  mat-raised-button
                  color="primary"
                  (click)="onSubmit()"
                  [disabled]="!isFormValid() || isProcessing()"
                >
                  @if (isProcessing()) {
                    <mat-spinner diameter="20"></mat-spinner>
                    Creating...
                  } @else {
                    <ng-container>
                      <mat-icon>check</mat-icon>
                      Create Tenant
                    </ng-container>
                  }
                </button>
              </div>
            </form>
          </mat-step>
        </mat-stepper>
      } @else {
        <!-- Edit Mode -->
        @if (editForm) {
          <form [formGroup]="editForm" class="edit-form">
            <mat-form-field appearance="outline">
              <mat-label>Tenant Name</mat-label>
              <input matInput formControlName="name" />
              <mat-icon matSuffix>business</mat-icon>
              @if (editForm.controls.name.hasError('minlength')) {
                <mat-error>Name must be at least 3 characters</mat-error>
              }
              @if (editForm.controls.name.hasError('maxlength')) {
                <mat-error>Name must not exceed 100 characters</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Contact Email</mat-label>
              <input matInput formControlName="contactEmail" type="email" />
              <mat-icon matSuffix>email</mat-icon>
              @if (editForm.controls.contactEmail.hasError('email')) {
                <mat-error>Invalid email format</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Contact Phone</mat-label>
              <input matInput formControlName="contactPhone" />
              <mat-icon matSuffix>phone</mat-icon>
              @if (editForm.controls.contactPhone.hasError('pattern')) {
                <mat-error>Invalid phone number format</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Address</mat-label>
              <textarea matInput formControlName="address" rows="3"></textarea>
              <mat-icon matSuffix>location_on</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Subscription Plan</mat-label>
              <mat-select formControlName="subscriptionPlan">
                <mat-option value="BASIC">Basic</mat-option>
                <mat-option value="STANDARD">Standard</mat-option>
                <mat-option value="PREMIUM">Premium</mat-option>
                <mat-option value="ENTERPRISE">Enterprise</mat-option>
              </mat-select>
              <mat-icon matSuffix>payments</mat-icon>
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Max Users</mat-label>
                <input matInput formControlName="maxUsers" type="number" min="1" />
                <mat-icon matSuffix>group</mat-icon>
                @if (editForm.controls.maxUsers.hasError('min')) {
                  <mat-error>Must be at least 1</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Max Patients</mat-label>
                <input matInput formControlName="maxPatients" type="number" min="1" />
                <mat-icon matSuffix>folder_shared</mat-icon>
                @if (editForm.controls.maxPatients.hasError('min')) {
                  <mat-error>Must be at least 1</mat-error>
                }
              </mat-form-field>
            </div>
          </form>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isProcessing()">Cancel</button>
      @if (data.mode === 'edit') {
        <button
          mat-raised-button
          color="primary"
          (click)="onSubmit()"
          [disabled]="editForm?.invalid || isProcessing()"
        >
          @if (isProcessing()) {
            <mat-spinner diameter="20"></mat-spinner>
            Saving...
          } @else {
            Save Changes
          }
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 500px;
        max-height: 70vh;
        overflow-y: auto;
      }

      .form-step,
      .edit-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px 0;
      }

      .form-row {
        display: flex;
        gap: 16px;

        mat-form-field {
          flex: 1;
        }
      }

      .step-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 16px;
      }

      mat-form-field {
        width: 100%;
      }

      mat-spinner {
        display: inline-block;
        margin-right: 8px;
      }

      @media (max-width: 600px) {
        .form-row {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class TenantFormDialog implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TenantFormDialog>);
  private readonly tenantsService = inject(TenantsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  isProcessing = signal(false);
  showPassword = signal(false);
  existingTenant = signal<TenantDetailDto | null>(null);

  // Forms for create mode (stepper)
  basicInfoForm!: FormGroup;
  contactForm!: FormGroup;
  subscriptionForm!: FormGroup;
  adminForm!: FormGroup;

  // Form for edit mode
  editForm?: FormGroup;

  // -------- Subdomain availability (lazy creation) --------
  private readonly subdomainSig: WritableSignal<string> = signal('');
  private subdomainResource: HttpResourceRef<SubdomainAvailabilityDto | undefined> | null = null;

  private getOrCreateSubdomainResource(): HttpResourceRef<SubdomainAvailabilityDto | undefined> {
    if (!this.subdomainResource) {
      this.subdomainResource = runInInjectionContext(this.injector, () =>
        this.tenantsService.checkSubdomainAvailability(this.subdomainSig)
      );
    }
    return this.subdomainResource;
  }

  ngOnInit(): void {
    if (this.data.mode === 'create') {
      this.initializeCreateForms();
    } else {
      this.loadTenantAndInitializeEditForm();
    }
  }

  private initializeCreateForms(): void {
    this.basicInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      subdomain: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          subdomainPatternValidator,
        ],
        [
          // ✅ Async validator with lazy resource creation
          createSubdomainAvailabilityValidatorLazy(this.subdomainSig, () =>
            this.getOrCreateSubdomainResource()
          ),
        ],
      ],
      specialty: ['CLINIC', Validators.required],
    });

    this.contactForm = this.fb.group({
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', Validators.pattern(/^\+?[0-9\-\s]+$/)],
      address: [''],
    });

    this.subscriptionForm = this.fb.group({
      subscriptionPlan: ['BASIC', Validators.required],
      maxUsers: [10, [Validators.required, Validators.min(1)]],
      maxPatients: [1000, [Validators.required, Validators.min(1)]],
    });

    this.adminForm = this.fb.group({
      adminUsername: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      adminEmail: ['', [Validators.required, Validators.email]],
      adminFirstName: ['', Validators.required],
      adminLastName: ['', Validators.required],
      adminPassword: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  private loadTenantAndInitializeEditForm(): void {
    if (!this.data.tenantId) return;

    this.isProcessing.set(true);

    // Initialize empty form first to avoid template errors
    this.initializeEmptyEditForm();

    // Load tenant data using observables directly (no toObservable needed)
    runInInjectionContext(this.injector, () => {
      const tenantIdSig = signal(this.data.tenantId!);
      const tenantResource = this.tenantsService.getTenantById(tenantIdSig);

      // Poll for the resource to load
      const checkInterval = setInterval(() => {
        if (!tenantResource.isLoading()) {
          clearInterval(checkInterval);
          this.isProcessing.set(false);

          const value = tenantResource.value();
          const error = tenantResource.error();

          if (error) {
            this.dialogRef.close();
            return;
          }

          if (value) {
            this.existingTenant.set(value);
            this.updateEditForm(value);
          } else {
            this.dialogRef.close();
          }
        }
      }, 100);

      // Clean up interval if component is destroyed
      this.destroyRef.onDestroy(() => clearInterval(checkInterval));
    });
  }

  private initializeEmptyEditForm(): void {
    // Initialize with empty values to prevent template errors
    this.editForm = this.fb.group({
      name: ['', [Validators.minLength(3), Validators.maxLength(100)]],
      contactEmail: ['', Validators.email],
      contactPhone: ['', Validators.pattern(/^\+?[0-9\-\s]+$/)],
      address: [''],
      subscriptionPlan: ['BASIC'],
      maxUsers: [1, Validators.min(1)],
      maxPatients: [1, Validators.min(1)],
    });
  }

  private updateEditForm(tenant: TenantDetailDto): void {
    // Update the existing form with tenant data
    this.editForm?.patchValue({
      name: tenant.name,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone || '',
      address: tenant.address || '',
      subscriptionPlan: tenant.subscriptionPlan,
      maxUsers: tenant.maxUsers,
      maxPatients: tenant.maxPatients,
    });
  }

  isFormValid(): boolean {
    if (this.data.mode === 'create') {
      return (
        this.basicInfoForm.valid &&
        this.contactForm.valid &&
        this.subscriptionForm.valid &&
        this.adminForm.valid
      );
    }
    return this.editForm?.valid ?? false;
  }

  onSubmit(): void {
    if (!this.isFormValid() || this.isProcessing()) return;

    this.isProcessing.set(true);

    if (this.data.mode === 'create') {
      const request: TenantCreateRequest = {
        ...this.basicInfoForm.value,
        ...this.contactForm.value,
        ...this.subscriptionForm.value,
        ...this.adminForm.value,
      } as TenantCreateRequest;

      this.tenantsService
        .createTenant(request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: response => this.dialogRef.close(response),
          error: () => this.isProcessing.set(false),
        });
    } else {
      const request: TenantUpdateRequest = this.editForm?.value as TenantUpdateRequest;

      this.tenantsService
        .updateTenant(this.data.tenantId!, request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: response => this.dialogRef.close(response),
          error: () => this.isProcessing.set(false),
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
