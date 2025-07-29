import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AuthCallbackComponent } from './auth-callback.component';
import { KeycloakAuthService } from '@core/authentication/keycloak-auth.service';

describe('AuthCallbackComponent', () => {
  let component: AuthCallbackComponent;
  let fixture: ComponentFixture<AuthCallbackComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockKeycloakAuth: jasmine.SpyObj<KeycloakAuthService>;
  let mockToastr: jasmine.SpyObj<ToastrService>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    // Create mock services
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    mockKeycloakAuth = jasmine.createSpyObj('KeycloakAuthService', [
      'handleAuthCallback',
      'clearError',
      'error',
    ]);
    mockToastr = jasmine.createSpyObj('ToastrService', ['success', 'error']);

    // Mock ActivatedRoute
    mockActivatedRoute = {
      snapshot: {
        queryParams: {},
      },
    };

    await TestBed.configureTestingModule({
      imports: [AuthCallbackComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: KeycloakAuthService, useValue: mockKeycloakAuth },
        { provide: ToastrService, useValue: mockToastr },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthCallbackComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should handle successful authentication callback', () => {
      // Arrange
      mockActivatedRoute.snapshot.queryParams = {
        code: 'test-auth-code',
        state: 'test-state',
      };
      mockKeycloakAuth.handleAuthCallback.and.returnValue(of(true));

      // Act
      fixture.detectChanges();

      // Assert
      expect(mockKeycloakAuth.handleAuthCallback).toHaveBeenCalledWith(
        'test-auth-code',
        'test-state'
      );
      expect(mockToastr.success).toHaveBeenCalledWith('Successfully authenticated!');
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/dashboard');
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('should handle failed authentication callback', () => {
      // Arrange
      mockActivatedRoute.snapshot.queryParams = {
        code: 'test-auth-code',
        state: 'test-state',
      };
      mockKeycloakAuth.handleAuthCallback.and.returnValue(of(false));
      mockKeycloakAuth.error.and.returnValue('Authentication failed');

      // Act
      fixture.detectChanges();

      // Assert
      expect(mockKeycloakAuth.handleAuthCallback).toHaveBeenCalledWith(
        'test-auth-code',
        'test-state'
      );
      expect(mockToastr.error).toHaveBeenCalledWith('Authentication failed');
      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('Authentication failed');
    });

    it('should handle OAuth error in query params', () => {
      // Arrange
      mockActivatedRoute.snapshot.queryParams = {
        error: 'access_denied',
        error_description: 'User denied access',
      };

      // Act
      fixture.detectChanges();

      // Assert
      expect(mockKeycloakAuth.handleAuthCallback).not.toHaveBeenCalled();
      expect(mockToastr.error).toHaveBeenCalledWith(
        'Access was denied. You may not have permission to access this application.'
      );
      expect(component.loading()).toBe(false);
      expect(component.error()).toContain('Access was denied');
    });

    it('should handle missing authorization code', () => {
      // Arrange
      mockActivatedRoute.snapshot.queryParams = {};

      // Act
      fixture.detectChanges();

      // Assert
      expect(mockKeycloakAuth.handleAuthCallback).not.toHaveBeenCalled();
      expect(mockToastr.error).toHaveBeenCalledWith('Missing authorization code');
      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('Missing authorization code');
    });

    it('should use return URL from session storage', () => {
      // Arrange
      mockActivatedRoute.snapshot.queryParams = {
        code: 'test-auth-code',
      };
      mockKeycloakAuth.handleAuthCallback.and.returnValue(of(true));
      spyOn(sessionStorage, 'getItem').and.returnValue('/patients');
      spyOn(sessionStorage, 'removeItem');

      // Act
      fixture.detectChanges();

      // Assert
      expect(sessionStorage.getItem).toHaveBeenCalledWith('auth_return_url');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('auth_return_url');
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/patients');
    });
  });

  describe('retry', () => {
    it('should clear errors and navigate to login', () => {
      // Arrange
      spyOn(sessionStorage, 'getItem').and.returnValue('/patients');

      // Act
      component.retry();

      // Assert
      expect(mockKeycloakAuth.clearError).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/patients' },
      });
    });
  });

  describe('goHome', () => {
    it('should navigate to home page', () => {
      // Act
      component.goHome();

      // Assert
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
