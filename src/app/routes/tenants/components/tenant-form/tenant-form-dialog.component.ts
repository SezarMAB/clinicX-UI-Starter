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
} from '../../validators/subdomain-availability.validator';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpResourceRef } from '@angular/common/http';
import { ConfirmDeleteDialogComponent } from '../confirm-delete/confirm-delete-dialog.component';

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
  templateUrl: './tenant-form-dialog.component.html',
  styleUrls: ['./tenant-form-dialog.component.scss'],
})
export class TenantFormDialogComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TenantFormDialogComponent>);
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
