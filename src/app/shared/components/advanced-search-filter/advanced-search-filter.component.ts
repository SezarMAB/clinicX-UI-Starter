import { Component, EventEmitter, Input, Output, inject, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface SearchFilterConfig {
  key: string;
  label: string;
  fieldGroup?: FormlyFieldConfig[];
}

@Component({
  selector: 'app-advanced-search-filter',
  standalone: true,
  templateUrl: './advanced-search-filter.component.html',
  styleUrls: ['./advanced-search-filter.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    MatBadgeModule,
    MatDividerModule,
    FormlyModule,
    TranslateModule,
  ],
})
export class AdvancedSearchFilterComponent implements OnInit, OnChanges {
  @Input() expanded = false;
  @Input() activeFilterCount = 0;
  @Output() filtersChanged = new EventEmitter<any>();
  @Output() clearFilters = new EventEmitter<void>();

  filterConfig: SearchFilterConfig[] = [];

  private translate = inject(TranslateService);

  form = new FormGroup({});
  model: any = {};
  fields: FormlyFieldConfig[] = [];

  constructor() {
    this.initializeFilterConfig();
  }

  ngOnInit() {
    this.buildFormFields();
  }

  ngOnChanges() {
    if (this.filterConfig) {
      this.buildFormFields();
    }
  }

  private buildFormFields() {
    this.fields = this.filterConfig.map(section => ({
      key: section.key,
      fieldGroup: section.fieldGroup || [],
    }));
  }

  onApplyFilters() {
    if (this.form.valid) {
      this.filtersChanged.emit(this.model);
    }
  }

  onClearFilters() {
    this.model = {};
    this.form.reset();
    this.clearFilters.emit();
  }

  getActiveFilterCount(): number {
    let count = 0;
    const countFilters = (obj: any): void => {
      for (const key in obj) {
        const value = obj[key];
        // Skip null, undefined, empty strings, and false boolean values
        if (value !== null && value !== undefined && value !== '' && value !== false) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            countFilters(value);
          } else {
            count++;
          }
        }
      }
    };
    countFilters(this.model);
    return count;
  }

  /**
   * Initialize filter configuration for dynamic form
   */
  private initializeFilterConfig(): void {
    this.filterConfig = [
      {
        key: 'balance',
        label: this.translate.instant('patients.balance_range'),
        fieldGroup: [
          {
            fieldGroupClassName: 'row',
            fieldGroup: [
              {
                key: 'balanceFrom',
                type: 'input',
                className: 'col',
                props: {
                  label: this.translate.instant('patients.balance_from'),
                  placeholder: '0.00',
                  type: 'number',
                },
              },
              {
                key: 'balanceTo',
                type: 'input',
                className: 'col',
                props: {
                  label: this.translate.instant('patients.balance_to'),
                  placeholder: '0.00',
                  type: 'number',
                },
              },
              {
                key: 'balanceType',
                type: 'select',
                className: 'col',
                props: {
                  label: this.translate.instant('patients.balance_type'),
                  placeholder: this.translate.instant('patients.all'),
                  options: [
                    { label: this.translate.instant('patients.all'), value: '' },
                    {
                      label: this.translate.instant('patients.negative_balance'),
                      value: 'negative',
                    },
                    {
                      label: this.translate.instant('patients.positive_balance'),
                      value: 'positive',
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        key: 'demographics',
        label: this.translate.instant('patients.demographics_status'),
        fieldGroup: [
          {
            fieldGroupClassName: 'row row-2',
            fieldGroup: [
              {
                key: 'gender',
                type: 'select',
                // className: 'col',
                props: {
                  label: this.translate.instant('patients.gender'),
                  placeholder: this.translate.instant('patients.all'),
                  options: [
                    { label: this.translate.instant('patients.all'), value: '' },
                    { label: this.translate.instant('patients.male'), value: 'MALE' },
                    { label: this.translate.instant('patients.female'), value: 'FEMALE' },
                    { label: this.translate.instant('patients.other'), value: 'OTHER' },
                    {
                      label: this.translate.instant('patients.prefer_not_to_say'),
                      value: 'PREFER_NOT_TO_SAY',
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        key: 'history',
        label: this.translate.instant('patients.patient_history'),
        fieldGroup: [
          {
            fieldGroupClassName: 'row',
            fieldGroup: [
              {
                key: 'isActive',
                type: 'checkbox',
                // className: 'col',
                defaultValue: false,
                props: {
                  label: this.translate.instant('patients.active_patients_only'),
                },
              },
              {
                key: 'hasMedicalNotes',
                type: 'checkbox',
                // className: 'col',
                defaultValue: false,
                props: {
                  label: this.translate.instant('patients.has_medical_notes'),
                },
              },
              {
                key: 'hasAppointments',
                type: 'checkbox',
                // className: 'col',
                defaultValue: false,
                props: {
                  label: this.translate.instant('patients.has_appointments'),
                },
              },
              {
                key: 'hasTreatments',
                type: 'checkbox',
                // className: 'col',
                defaultValue: false,
                props: {
                  label: this.translate.instant('patients.has_treatments'),
                },
              },
            ],
          },
        ],
      },
    ];
  }
}
