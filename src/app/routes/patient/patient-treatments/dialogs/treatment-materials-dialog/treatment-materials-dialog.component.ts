import { Component, Inject, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, map, startWith } from 'rxjs';

interface MaterialItem {
  id?: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface DialogData {
  visitId: string;
  materials?: MaterialItem[];
}

@Component({
  selector: 'app-treatment-materials-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    TranslateModule,
  ],
  templateUrl: './treatment-materials-dialog.component.html',
  styleUrls: ['./treatment-materials-dialog.component.scss'],
})
export class TreatmentMaterialsDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  // Form
  materialsForm!: FormGroup;

  // State signals
  saving = signal(false);

  // Available materials (could be loaded from backend)
  availableMaterials = signal<MaterialItem[]>([
    {
      id: '1',
      name: 'Composite Filling Material',
      category: 'Restorative',
      quantity: 1,
      unitPrice: 45,
      totalPrice: 45,
    },
    {
      id: '2',
      name: 'Dental Cement',
      category: 'Adhesive',
      quantity: 1,
      unitPrice: 35,
      totalPrice: 35,
    },
    {
      id: '3',
      name: 'Local Anesthetic',
      category: 'Anesthetic',
      quantity: 1,
      unitPrice: 15,
      totalPrice: 15,
    },
    {
      id: '4',
      name: 'Rubber Dam',
      category: 'Isolation',
      quantity: 1,
      unitPrice: 5,
      totalPrice: 5,
    },
    {
      id: '5',
      name: 'Cotton Rolls',
      category: 'Consumable',
      quantity: 10,
      unitPrice: 0.5,
      totalPrice: 5,
    },
    {
      id: '6',
      name: 'Dental Bur',
      category: 'Instrument',
      quantity: 1,
      unitPrice: 25,
      totalPrice: 25,
    },
    {
      id: '7',
      name: 'Matrix Band',
      category: 'Restorative',
      quantity: 1,
      unitPrice: 8,
      totalPrice: 8,
    },
    { id: '8', name: 'Wedges', category: 'Restorative', quantity: 2, unitPrice: 3, totalPrice: 6 },
  ]);

  // Material categories
  readonly categories = [
    'Restorative',
    'Adhesive',
    'Anesthetic',
    'Isolation',
    'Consumable',
    'Instrument',
    'Endodontic',
    'Periodontic',
    'Orthodontic',
    'Other',
  ];

  // Computed values
  totalCost = computed(() => {
    const materials = this.materialsArray.value;
    return materials.reduce((sum, material) => {
      const quantity = material.get('quantity')?.value || 0;
      const unitPrice = material.get('unitPrice')?.value || 0;
      return sum + quantity * unitPrice;
    }, 0);
  });

  // Filtered materials for autocomplete
  filteredMaterials$!: Observable<MaterialItem[]>;

  readonly dialogRef = inject(MatDialogRef<TreatmentMaterialsDialogComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  ngOnInit(): void {
    this.initializeForm();
    this.setupAutocomplete();
  }

  private initializeForm(): void {
    this.materialsForm = this.fb.group({
      materials: this.fb.array([]),
    });

    // Add existing materials if any
    if (this.data.materials && this.data.materials.length > 0) {
      this.data.materials.forEach(material => {
        this.addMaterial(material);
      });
    } else {
      // Add one empty row by default
      this.addMaterial();
    }
  }

  get materialsArray(): FormArray {
    return this.materialsForm.get('materials') as FormArray;
  }

  addMaterial(material?: MaterialItem): void {
    const materialGroup = this.fb.group({
      name: [material?.name || '', Validators.required],
      category: [material?.category || '', Validators.required],
      quantity: [material?.quantity || 1, [Validators.required, Validators.min(1)]],
      unitPrice: [material?.unitPrice || 0, [Validators.required, Validators.min(0)]],
      totalPrice: [{ value: material?.totalPrice || 0, disabled: true }],
    });

    // Update total price when quantity or unit price changes
    materialGroup.get('quantity')?.valueChanges.subscribe(() => {
      this.updateTotalPrice(materialGroup);
    });

    materialGroup.get('unitPrice')?.valueChanges.subscribe(() => {
      this.updateTotalPrice(materialGroup);
    });

    this.materialsArray.push(materialGroup);
  }

  removeMaterial(index: number): void {
    this.materialsArray.removeAt(index);
  }

  private updateTotalPrice(materialGroup: FormGroup): void {
    const quantity = materialGroup.get('quantity')?.value || 0;
    const unitPrice = materialGroup.get('unitPrice')?.value || 0;
    const totalPrice = quantity * unitPrice;
    materialGroup.get('totalPrice')?.setValue(totalPrice);
  }

  selectPredefinedMaterial(material: MaterialItem, index: number): void {
    const materialGroup = this.materialsArray.at(index);
    materialGroup.patchValue({
      name: material.name,
      category: material.category,
      quantity: material.quantity,
      unitPrice: material.unitPrice,
    });
    this.updateTotalPrice(materialGroup as FormGroup);
  }

  private setupAutocomplete(): void {
    // Setup autocomplete for each material name field
    // This would be more complex in a real app with dynamic form arrays
  }

  onSubmit(): void {
    if (this.materialsForm.invalid) {
      this.materialsForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const materials = this.materialsArray.value.map((material: any) => ({
      ...material,
      totalPrice: material.quantity * material.unitPrice,
    }));

    // Simulate API call
    setTimeout(() => {
      this.saving.set(false);
      this.dialogRef.close(materials);
    }, 500);

    // TODO: In real app, save materials to backend
    // this.treatmentsService.addMaterials(this.data.visitId, materials).subscribe({
    //   next: () => {
    //     this.dialogRef.close(materials);
    //   },
    //   error: (error) => {
    //     console.error('Error saving materials:', error);
    //     this.saving.set(false);
    //   }
    // });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(fieldName: string, index: number): string {
    const control = this.materialsArray.at(index).get(fieldName);

    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.errors.required) {
      return this.translate.instant('validation.field_required');
    }

    if (control.errors.min) {
      return this.translate.instant('validation.min_value', { value: control.errors.min.min });
    }

    return this.translate.instant('validation.invalid_value');
  }
}
