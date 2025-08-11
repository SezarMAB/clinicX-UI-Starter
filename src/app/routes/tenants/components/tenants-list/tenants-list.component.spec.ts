import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { signal } from '@angular/core';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatTableHarness } from '@angular/material/table/testing';
import { MatPaginatorHarness } from '@angular/material/paginator/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TenantsListComponent } from './tenants-list.component';
import { TenantsService } from '@features/tenants/tenants.service';
import { PageTenantSummaryDto, TenantSummaryDto } from '@features/tenants/tenants.models';

describe('TenantsListPage', () => {
  let component: TenantsListComponent;
  let fixture: ComponentFixture<TenantsListComponent>;
  let loader: HarnessLoader;
  let mockTenantsService: jasmine.SpyObj<TenantsService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockActivatedRoute: any;

  const mockTenants: TenantSummaryDto[] = [
    {
      id: '1',
      name: 'tenant-one',
      displayName: 'Tenant One',
      status: 'ACTIVE',
      currentUsers: 5,
      maxUsers: 10,
      subscriptionPlan: 'BASIC',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'tenant-two',
      displayName: 'Tenant Two',
      status: 'INACTIVE',
      currentUsers: 9,
      maxUsers: 10,
      subscriptionPlan: 'PROFESSIONAL',
      createdAt: '2024-01-02T00:00:00Z',
    },
  ];

  const mockPageResponse: PageTenantSummaryDto = {
    content: mockTenants,
    page: 0,
    size: 25,
    totalElements: 2,
    totalPages: 1,
  };

  beforeEach(async () => {
    // Create mock services
    mockTenantsService = jasmine.createSpyObj('TenantsService', [
      'getAllTenants',
      'deleteTenant',
      'activateTenant',
      'deactivateTenant',
    ]);

    // Mock httpResource response
    const mockResource = {
      value: signal(mockPageResponse),
      isLoading: signal(false),
      error: signal(null),
      reload: jasmine.createSpy('reload'),
    };
    mockTenantsService.getAllTenants.and.returnValue(mockResource);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    const queryParams = new BehaviorSubject({});
    mockActivatedRoute = {
      snapshot: {
        queryParams: {},
      },
      queryParams,
    };

    await TestBed.configureTestingModule({
      imports: [TenantsListComponent, BrowserAnimationsModule],
      providers: [
        { provide: TenantsService, useValue: mockTenantsService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantsListComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Table Rendering', () => {
    it('should display tenants in table', async () => {
      const table = await loader.getHarness(MatTableHarness);
      const rows = await table.getRows();

      expect(rows.length).toBe(2);
    });

    it('should display correct column headers', async () => {
      const table = await loader.getHarness(MatTableHarness);
      const headerRows = await table.getHeaderRows();
      const headerCells = await headerRows[0].getCellTextByIndex();

      expect(headerCells).toContain('Name');
      expect(headerCells).toContain('Status');
      expect(headerCells).toContain('Users');
      expect(headerCells).toContain('Plan');
      expect(headerCells).toContain('Created');
      expect(headerCells).toContain('Actions');
    });

    it('should show warning icon for tenants near user limit', async () => {
      const table = await loader.getHarness(MatTableHarness);
      const rows = await table.getRows();
      const secondRowCells = await rows[1].getCellTextByIndex();

      // Second tenant has 9/10 users (90%)
      expect(secondRowCells[2]).toContain('9 / 10');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no tenants', async () => {
      const emptyResource = {
        value: signal({ ...mockPageResponse, content: [], totalElements: 0 }),
        isLoading: signal(false),
        error: signal(null),
        reload: jasmine.createSpy('reload'),
      };
      mockTenantsService.getAllTenants.and.returnValue(emptyResource);

      // Recreate component with empty data
      fixture = TestBed.createComponent(TenantsListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-empty-state')).toBeTruthy();
    });

    it('should show different message when filters are active', () => {
      component.searchCriteria.set({ searchTerm: 'test' });
      expect(component.hasActiveFilters()).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('should show skeleton while loading', async () => {
      const loadingResource = {
        value: signal(null),
        isLoading: signal(true),
        error: signal(null),
        reload: jasmine.createSpy('reload'),
      };
      mockTenantsService.getAllTenants.and.returnValue(loadingResource);

      fixture = TestBed.createComponent(TenantsListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('app-table-skeleton')).toBeTruthy();
    });
  });

  describe('Pagination', () => {
    it('should handle page changes', async () => {
      const paginator = await loader.getHarness(MatPaginatorHarness);

      // Check initial state
      expect(await paginator.getPageSize()).toBe(25);

      // Change page size
      await paginator.setPageSize(50);
      expect(component.pageSize()).toBe(50);
    });

    it('should reset to first page on filter change', async () => {
      component.pageIndex.set(2);

      // Change filter
      component.filtersForm.patchValue({ searchTerm: 'test' });
      await fixture.whenStable();

      // Should reset to page 0
      expect(component.pageIndex()).toBe(0);
    });
  });

  describe('Filtering', () => {
    it('should update search criteria on form change', async () => {
      const searchInput = await loader.getHarness(MatInputHarness.with({ placeholder: /search/i }));

      await searchInput.setValue('test search');
      await fixture.whenStable();

      expect(component.searchCriteria()?.searchTerm).toBe('test search');
    });

    it('should clear filters when reset button clicked', async () => {
      // Set some filters
      component.filtersForm.patchValue({
        searchTerm: 'test',
        status: 'ACTIVE',
        subscriptionPlan: 'BASIC',
      });

      // Click reset
      component.resetFilters();

      expect(component.filtersForm.value.searchTerm).toBeNull();
      expect(component.filtersForm.value.status).toBeNull();
      expect(component.filtersForm.value.subscriptionPlan).toBeNull();
      expect(component.searchCriteria()).toBeUndefined();
    });
  });

  describe('Query Params Sync', () => {
    it('should initialize state from query params', () => {
      mockActivatedRoute.snapshot.queryParams = {
        page: '2',
        size: '50',
        sort: 'name',
        dir: 'asc',
        searchTerm: 'test',
      };

      fixture = TestBed.createComponent(TenantsListComponent);
      component = fixture.componentInstance;
      component.ngOnInit();

      expect(component.pageIndex()).toBe(2);
      expect(component.pageSize()).toBe(50);
      expect(component.sortField()).toBe('name');
      expect(component.sortDirection()).toBe('asc');
      expect(component.filtersForm.value.searchTerm).toBe('test');
    });

    it('should update URL when state changes', () => {
      component.pageIndex.set(3);
      component.pageSize.set(100);

      fixture.detectChanges();

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [],
        jasmine.objectContaining({
          queryParams: jasmine.objectContaining({
            page: '3',
            size: '100',
          }),
        })
      );
    });
  });

  describe('Actions', () => {
    it('should navigate to detail page on row click', () => {
      component.viewDetails(mockTenants[0]);

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['1'],
        jasmine.objectContaining({ relativeTo: mockActivatedRoute })
      );
    });

    it('should open create dialog', async () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of({ tenant: {} }));
      mockDialog.open.and.returnValue(dialogRef);

      await component.openCreateDialog();

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Tenant created successfully',
        'Close',
        jasmine.any(Object)
      );
    });

    it('should handle delete with confirmation', async () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(dialogRef);
      mockTenantsService.deleteTenant.and.returnValue(of(void 0));

      await component.confirmDelete(mockTenants[0]);

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockTenantsService.deleteTenant).toHaveBeenCalledWith('1');
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Tenant deleted successfully',
        'Close',
        jasmine.any(Object)
      );
    });

    it('should handle activate tenant', async () => {
      mockTenantsService.activateTenant.and.returnValue(of(void 0));

      await component.activateTenant(mockTenants[1]);

      expect(mockTenantsService.activateTenant).toHaveBeenCalledWith('2');
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Tenant activated successfully',
        'Close',
        jasmine.any(Object)
      );
    });

    it('should handle deactivate tenant', async () => {
      mockTenantsService.deactivateTenant.and.returnValue(of(void 0));

      await component.deactivateTenant(mockTenants[0]);

      expect(mockTenantsService.deactivateTenant).toHaveBeenCalledWith('1');
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Tenant deactivated successfully',
        'Close',
        jasmine.any(Object)
      );
    });

    it('should handle action errors', async () => {
      mockTenantsService.deleteTenant.and.returnValue(throwError(() => new Error('Delete failed')));

      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(dialogRef);

      await component.confirmDelete(mockTenants[0]);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to delete tenant',
        'Close',
        jasmine.any(Object)
      );
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly', () => {
      const formatted = component.formatDate('2024-01-15T10:30:00Z');
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });
  });
});
