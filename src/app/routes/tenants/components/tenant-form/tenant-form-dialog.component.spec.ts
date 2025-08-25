import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, timer } from 'rxjs';
import { signal } from '@angular/core';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatStepperHarness } from '@angular/material/stepper/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';

import { TenantFormDialogComponent } from './tenant-form-dialog.component';
import { TenantsService } from '@features/tenants/tenants.service';
import {
  TenantCreateRequest,
  TenantUpdateRequest,
  TenantCreationResponseDto,
  TenantDetailDto,
} from '@features/tenants/tenants.models';

describe('TenantFormDialog', () => {
  let component: TenantFormDialogComponent;
  let fixture: ComponentFixture<TenantFormDialogComponent>;
  let loader: HarnessLoader;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<TenantFormDialogComponent>>;
  let mockTenantsService: jasmine.SpyObj<TenantsService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockTenant: TenantDetailDto = {
    id: '123',
    name: 'test-tenant',
    displayName: 'Test Tenant',
    domain: 'test.example.com',
    status: 'ACTIVE',
    description: 'Test description',
    contactEmail: 'contact@test.com',
    contactPhone: '+1234567890',
    address: '123 Test St',
    maxUsers: 100,
    currentUsers: 10,
    subscriptionPlan: 'PROFESSIONAL',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    expirationDate: null,
  };

  const mockCreationResponse: TenantCreationResponseDto = {
    tenant: mockTenant,
    adminUser: {
      userId: 'admin-123',
      username: 'admin',
      email: 'admin@test.com',
      temporaryPassword: 'TempPass123!',
    },
    keycloakRealm: 'test-tenant',
  };

  describe('Create Mode', () => {
    beforeEach(async () => {
      mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
      mockTenantsService = jasmine.createSpyObj('TenantsService', [
        'createTenant',
        'updateTenant',
        'checkSubdomainAvailability',
      ]);
      mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

      // Mock subdomain availability check
      const availabilityResource = {
        value: signal({ available: true }),
        isLoading: signal(false),
        error: signal(null),
      };
      mockTenantsService.checkSubdomainAvailability.and.returnValue(availabilityResource);

      await TestBed.configureTestingModule({
        imports: [TenantFormDialogComponent, BrowserAnimationsModule, ReactiveFormsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'create' } },
          { provide: TenantsService, useValue: mockTenantsService },
          { provide: MatSnackBar, useValue: mockSnackBar },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TenantFormDialogComponent);
      component = fixture.componentInstance;
      loader = TestbedHarnessEnvironment.loader(fixture);
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
      expect(component.data.mode).toBe('create');
    });

    it('should have stepper for create mode', async () => {
      const stepper = await loader.getHarness(MatStepperHarness);
      const steps = await stepper.getSteps();

      expect(steps.length).toBe(2);
    });

    it('should validate tenant form fields', async () => {
      const form = component.tenantForm;

      expect(form.valid).toBeFalsy();

      // Fill required fields
      form.patchValue({
        name: 'new-tenant',
        displayName: 'New Tenant',
        contactEmail: 'contact@new.com',
        maxUsers: 50,
        subscriptionPlan: 'BASIC',
      });

      await fixture.whenStable();
      expect(form.valid).toBeTruthy();
    });

    it('should validate subdomain format', () => {
      const nameControl = component.tenantForm.controls.name;

      // Invalid formats
      nameControl.setValue('Invalid Name');
      expect(nameControl.hasError('pattern')).toBeTruthy();

      nameControl.setValue('UPPERCASE');
      expect(nameControl.hasError('pattern')).toBeTruthy();

      // Valid format
      nameControl.setValue('valid-subdomain');
      expect(nameControl.hasError('pattern')).toBeFalsy();
    });

    it('should check subdomain availability asynchronously', fakeAsync(() => {
      const nameControl = component.tenantForm.controls.name;

      // Mock unavailable subdomain
      const unavailableResource = {
        value: signal({ available: false }),
        isLoading: signal(false),
        error: signal(null),
      };
      mockTenantsService.checkSubdomainAvailability.and.returnValue(unavailableResource);

      nameControl.setValue('taken-subdomain');
      tick(600); // Wait for debounce

      fixture.detectChanges();
      flush();

      expect(nameControl.hasError('unavailable')).toBeTruthy();
    }));

    it('should validate admin form fields', () => {
      const form = component.adminForm;

      expect(form.valid).toBeFalsy();

      // Fill required fields
      form.patchValue({
        username: 'adminuser',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
      });

      expect(form.valid).toBeTruthy();
    });

    it('should validate email format', () => {
      const emailControl = component.adminForm.controls.email;

      emailControl.setValue('invalid-email');
      expect(emailControl.hasError('email')).toBeTruthy();

      emailControl.setValue('valid@email.com');
      expect(emailControl.hasError('email')).toBeFalsy();
    });

    it('should create tenant successfully', async () => {
      // Fill forms
      component.tenantForm.patchValue({
        name: 'new-tenant',
        displayName: 'New Tenant',
        contactEmail: 'contact@new.com',
        maxUsers: 50,
        subscriptionPlan: 'BASIC',
      });

      component.adminForm.patchValue({
        username: 'admin',
        email: 'admin@new.com',
        firstName: 'Admin',
        lastName: 'User',
        temporaryPassword: true,
      });

      mockTenantsService.createTenant.and.returnValue(of(mockCreationResponse));

      await component.onSubmit();

      expect(mockTenantsService.createTenant).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: 'new-tenant',
          displayName: 'New Tenant',
          contactEmail: 'contact@new.com',
        })
      );

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Tenant created'),
        'Copy',
        jasmine.any(Object)
      );

      expect(mockDialogRef.close).toHaveBeenCalledWith(mockCreationResponse);
    });

    it('should handle creation error', async () => {
      component.tenantForm.patchValue({
        name: 'new-tenant',
        displayName: 'New Tenant',
        contactEmail: 'contact@new.com',
        maxUsers: 50,
        subscriptionPlan: 'BASIC',
      });

      component.adminForm.patchValue({
        username: 'admin',
        email: 'admin@new.com',
        firstName: 'Admin',
        lastName: 'User',
      });

      const error = { error: { message: 'Creation failed' } };
      mockTenantsService.createTenant.and.returnValue(throwError(() => error));

      await component.onSubmit();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Creation failed',
        'Close',
        jasmine.any(Object)
      );

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should disable submit while processing', async () => {
      expect(component.isSubmitting()).toBeFalsy();

      // Start submission
      component.isSubmitting.set(true);
      fixture.detectChanges();

      const submitButton = await loader.getHarness(
        MatButtonHarness.with({ text: /Create Tenant/i })
      );

      expect(await submitButton.isDisabled()).toBeTruthy();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
      mockTenantsService = jasmine.createSpyObj('TenantsService', ['createTenant', 'updateTenant']);
      mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

      await TestBed.configureTestingModule({
        imports: [TenantFormDialogComponent, BrowserAnimationsModule, ReactiveFormsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              mode: 'edit',
              tenantId: '123',
              tenant: mockTenant,
            },
          },
          { provide: TenantsService, useValue: mockTenantsService },
          { provide: MatSnackBar, useValue: mockSnackBar },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TenantFormDialogComponent);
      component = fixture.componentInstance;
      loader = TestbedHarnessEnvironment.loader(fixture);
      fixture.detectChanges();
    });

    it('should load tenant data in edit mode', () => {
      expect(component.editForm.value.displayName).toBe('Test Tenant');
      expect(component.editForm.value.contactEmail).toBe('contact@test.com');
      expect(component.editForm.value.maxUsers).toBe(100);
      expect(component.editForm.value.subscriptionPlan).toBe('PROFESSIONAL');
    });

    it('should not show stepper in edit mode', async () => {
      const steppers = await loader.getAllHarnesses(MatStepperHarness);
      expect(steppers.length).toBe(0);
    });

    it('should update tenant successfully', async () => {
      const updatedTenant = { ...mockTenant, displayName: 'Updated Name' };

      component.editForm.patchValue({
        displayName: 'Updated Name',
      });

      mockTenantsService.updateTenant.and.returnValue(of(updatedTenant));

      await component.onSubmit();

      expect(mockTenantsService.updateTenant).toHaveBeenCalledWith(
        '123',
        jasmine.objectContaining({
          displayName: 'Updated Name',
        })
      );

      expect(mockDialogRef.close).toHaveBeenCalledWith(updatedTenant);
    });

    it('should handle update error', async () => {
      const error = { error: { message: 'Update failed' } };
      mockTenantsService.updateTenant.and.returnValue(throwError(() => error));

      await component.onSubmit();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Update failed', 'Close', jasmine.any(Object));

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should validate max users minimum', () => {
      const maxUsersControl = component.editForm.controls.maxUsers;

      maxUsersControl.setValue(0);
      expect(maxUsersControl.hasError('min')).toBeTruthy();

      maxUsersControl.setValue(-1);
      expect(maxUsersControl.hasError('min')).toBeTruthy();

      maxUsersControl.setValue(1);
      expect(maxUsersControl.hasError('min')).toBeFalsy();
    });
  });

  describe('Dialog Actions', () => {
    beforeEach(async () => {
      mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
      mockTenantsService = jasmine.createSpyObj('TenantsService', [
        'createTenant',
        'updateTenant',
        'checkSubdomainAvailability',
      ]);
      mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

      const availabilityResource = {
        value: signal({ available: true }),
        isLoading: signal(false),
        error: signal(null),
      };
      mockTenantsService.checkSubdomainAvailability.and.returnValue(availabilityResource);

      await TestBed.configureTestingModule({
        imports: [TenantFormDialogComponent, BrowserAnimationsModule, ReactiveFormsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'create' } },
          { provide: TenantsService, useValue: mockTenantsService },
          { provide: MatSnackBar, useValue: mockSnackBar },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TenantFormDialogComponent);
      component = fixture.componentInstance;
      loader = TestbedHarnessEnvironment.loader(fixture);
      fixture.detectChanges();
    });

    it('should close dialog on cancel', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });

    it('should not submit when form is invalid', async () => {
      // Leave form empty (invalid)
      await component.onSubmit();

      expect(mockTenantsService.createTenant).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should prevent multiple simultaneous submissions', async () => {
      component.tenantForm.patchValue({
        name: 'test',
        displayName: 'Test',
        contactEmail: 'test@test.com',
        maxUsers: 10,
        subscriptionPlan: 'BASIC',
      });

      component.adminForm.patchValue({
        username: 'admin',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
      });

      // Simulate slow API
      mockTenantsService.createTenant.and.returnValue(
        timer(1000).pipe(() => of(mockCreationResponse))
      );

      // First submission
      const promise1 = component.onSubmit();
      expect(component.isSubmitting()).toBeTruthy();

      // Try second submission while first is in progress
      const promise2 = component.onSubmit();

      // Should only call service once
      expect(mockTenantsService.createTenant).toHaveBeenCalledTimes(1);

      await Promise.all([promise1, promise2]);
    });
  });
});
