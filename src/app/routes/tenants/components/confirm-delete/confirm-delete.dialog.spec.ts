import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';

import { ConfirmDeleteDialog } from './confirm-delete.dialog';

describe('ConfirmDeleteDialog', () => {
  let component: ConfirmDeleteDialog;
  let fixture: ComponentFixture<ConfirmDeleteDialog>;
  let loader: HarnessLoader;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ConfirmDeleteDialog>>;

  const defaultDialogData = {
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    itemName: 'Test Item',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ConfirmDeleteDialog, BrowserAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: defaultDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDeleteDialog);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Content Display', () => {
    it('should display the title', () => {
      const compiled = fixture.nativeElement;
      const title = compiled.querySelector('h2');

      expect(title.textContent).toContain('Delete Item');
    });

    it('should display the message', () => {
      const compiled = fixture.nativeElement;
      const content = compiled.querySelector('mat-dialog-content p');

      expect(content.textContent).toContain('Are you sure you want to delete this item?');
    });

    it('should display the item name', () => {
      const compiled = fixture.nativeElement;
      const itemName = compiled.querySelector('.item-name');

      expect(itemName.textContent).toContain('Test Item');
    });

    it('should not display item name if not provided', () => {
      // Create component without item name
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ConfirmDeleteDialog],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              title: 'Delete',
              message: 'Confirm deletion?',
            },
          },
        ],
      });

      fixture = TestBed.createComponent(ConfirmDeleteDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const itemName = compiled.querySelector('.item-name');

      expect(itemName).toBeNull();
    });

    it('should display warning icon', () => {
      const compiled = fixture.nativeElement;
      const icon = compiled.querySelector('h2 mat-icon');

      expect(icon.textContent).toContain('warning');
    });

    it('should display warning text', () => {
      const compiled = fixture.nativeElement;
      const warningText = compiled.querySelector('.warning-text');

      expect(warningText.textContent).toContain('This action cannot be undone');
    });
  });

  describe('Button Actions', () => {
    it('should have cancel and confirm buttons', async () => {
      const buttons = await loader.getAllHarnesses(MatButtonHarness);

      expect(buttons.length).toBe(2);

      const cancelButton = buttons[0];
      const confirmButton = buttons[1];

      expect(await cancelButton.getText()).toBe('Cancel');
      expect(await confirmButton.getText()).toContain('Delete');
    });

    it('should close with false when cancel clicked', async () => {
      const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));

      await cancelButton.click();

      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should close with true when confirm clicked', async () => {
      const confirmButton = await loader.getHarness(MatButtonHarness.with({ text: /Delete/i }));

      await confirmButton.click();

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should use custom button text', async () => {
      // Create component with custom button text
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ConfirmDeleteDialog],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              title: 'Remove',
              message: 'Remove this?',
              confirmText: 'Yes, Remove',
              cancelText: 'No, Keep It',
            },
          },
        ],
      });

      fixture = TestBed.createComponent(ConfirmDeleteDialog);
      component = fixture.componentInstance;
      loader = TestbedHarnessEnvironment.loader(fixture);
      fixture.detectChanges();

      const buttons = await loader.getAllHarnesses(MatButtonHarness);

      expect(await buttons[0].getText()).toBe('No, Keep It');
      expect(await buttons[1].getText()).toContain('Yes, Remove');
    });

    it('should use default button text when not provided', async () => {
      // Create component without custom button text
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ConfirmDeleteDialog],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              title: 'Delete',
              message: 'Delete this?',
            },
          },
        ],
      });

      fixture = TestBed.createComponent(ConfirmDeleteDialog);
      component = fixture.componentInstance;
      loader = TestbedHarnessEnvironment.loader(fixture);
      fixture.detectChanges();

      const buttons = await loader.getAllHarnesses(MatButtonHarness);

      expect(await buttons[0].getText()).toBe('Cancel');
      expect(await buttons[1].getText()).toContain('Delete');
    });
  });

  describe('Dialog Styling', () => {
    it('should apply warn color to confirm button', async () => {
      const confirmButton = await loader.getHarness(MatButtonHarness.with({ text: /Delete/i }));

      const host = await confirmButton.host();
      const color = await host.getAttribute('color');

      expect(color).toBe('warn');
    });

    it('should have delete icon in confirm button', () => {
      const compiled = fixture.nativeElement;
      const confirmButton = compiled.querySelector('button[color="warn"]');
      const icon = confirmButton.querySelector('mat-icon');

      expect(icon.textContent).toBe('delete');
    });
  });

  describe('Component Methods', () => {
    it('should call dialogRef.close(false) on cancel', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should call dialogRef.close(true) on confirm', () => {
      component.onConfirm();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });

  describe('Data Validation', () => {
    it('should handle missing optional fields gracefully', () => {
      // Create component with minimal data
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ConfirmDeleteDialog],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              title: 'Delete',
              message: 'Are you sure?',
            },
          },
        ],
      });

      fixture = TestBed.createComponent(ConfirmDeleteDialog);
      component = fixture.componentInstance;

      expect(() => fixture.detectChanges()).not.toThrow();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('h2').textContent).toContain('Delete');
      expect(compiled.querySelector('mat-dialog-content p').textContent).toContain('Are you sure?');
    });

    it('should display all provided data correctly', () => {
      const compiled = fixture.nativeElement;

      // Check all elements are displayed with correct data
      expect(compiled.querySelector('h2').textContent).toContain(defaultDialogData.title);
      expect(compiled.querySelector('mat-dialog-content p').textContent).toContain(
        defaultDialogData.message
      );
      expect(compiled.querySelector('.item-name').textContent).toContain(
        defaultDialogData.itemName
      );

      // Buttons should have correct text
      const buttons = compiled.querySelectorAll('button');
      expect(buttons[0].textContent).toContain(defaultDialogData.cancelText);
      expect(buttons[1].textContent).toContain(defaultDialogData.confirmText);
    });
  });
});
