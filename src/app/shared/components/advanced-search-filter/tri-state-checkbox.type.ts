import { Component, OnInit } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'formly-field-tri-state-checkbox',
  template: `
    <mat-checkbox
      [checked]="checked"
      [indeterminate]="indeterminate"
      [disabled]="props.disabled"
      (change)="onChange($event)"
    >
      {{ props.label }}
    </mat-checkbox>
  `,
  imports: [CommonModule, MatCheckboxModule],
})
export class TriStateCheckboxTypeComponent extends FieldType<FieldTypeConfig> implements OnInit {
  get checked(): boolean {
    return this.formControl.value === true;
  }

  get indeterminate(): boolean {
    return this.formControl.value === null || this.formControl.value === undefined;
  }

  ngOnInit() {
    if (this.formControl.value === undefined) {
      this.formControl.setValue(null);
    }
  }

  onChange(event: any) {
    const currentValue = this.formControl.value;
    let newValue: boolean | null;

    if (currentValue === null || currentValue === undefined) {
      newValue = true;
    } else if (currentValue === true) {
      newValue = false;
    } else {
      newValue = null;
    }

    this.formControl.setValue(newValue);
  }
}
