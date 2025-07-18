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
import { TranslateModule } from '@ngx-translate/core';

export interface SearchFilterConfig {
  key: string;
  label: string;
  fieldGroup?: FormlyFieldConfig[];
}

@Component({
  selector: 'app-advanced-search-filter',
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
  @Input() filterConfig: SearchFilterConfig[] = [];
  @Input() expanded = false;
  @Input() activeFilterCount = 0;
  @Output() filtersChanged = new EventEmitter<any>();
  @Output() clearFilters = new EventEmitter<void>();

  form = new FormGroup({});
  model: any = {};
  fields: FormlyFieldConfig[] = [];

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
      fieldGroup: section.fieldGroup,
      props: {
        label: section.label,
      },
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
}
