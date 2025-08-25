# Angular Material 20 Implementation Guide

## Overview
This folder contains reference implementations of Angular Material 20 components following best practices and modern Angular patterns. These examples demonstrate proper usage of Material Design components with Angular's latest features including signals, standalone components, and the new control flow syntax.

## Key Implementation Patterns

### 1. Table Implementation (`table/table.component.html`)

#### Correct Material Table Structure
```html
<mat-table [dataSource]="dataSource" matSort>
  <!-- Column Definitions -->
  <ng-container cdkColumnDef="columnName">
    <mat-header-cell *cdkHeaderCellDef mat-sort-header>Header</mat-header-cell>
    <mat-cell *cdkCellDef="let row">{{ row.property }}</mat-cell>
  </ng-container>
  
  <!-- Header and Row Declarations -->
  <mat-header-row *cdkHeaderRowDef="displayedColumns" />
  <mat-row *cdkRowDef="let row; columns: displayedColumns" />
</mat-table>
```

**Important Notes:**
- Use `cdkColumnDef` for column containers
- Use `*cdkHeaderCellDef` and `*cdkCellDef` for cell templates
- Use `*cdkHeaderRowDef` and `*cdkRowDef` for row templates
- NO `matColumnDef` - this doesn't exist in Angular Material
- NO `trackBy` in `*cdkRowDef` - use DataSource's trackBy instead

### 2. Form Fields (`form-field/form-field.component.html`)

#### Standard Form Field Structure
```html
<mat-form-field appearance="outline">
  <mat-label>Label Text</mat-label>
  <input matInput placeholder="Placeholder" />
  <mat-icon matPrefix>icon_name</mat-icon>
  <mat-icon matSuffix>icon_name</mat-icon>
  <mat-hint>Hint text</mat-hint>
  <mat-error>Error message</mat-error>
</mat-form-field>
```

**Appearance Options:**
- `outline` (recommended)
- `fill`
- Default (legacy)

### 3. Buttons (`button/button.component.html`)

#### Button Variants
```html
<!-- Basic Buttons -->
<button mat-button>Basic</button>
<button mat-raised-button>Raised</button>
<button mat-flat-button>Flat</button>
<button mat-stroked-button>Stroked</button>

<!-- Icon Buttons -->
<button mat-icon-button>
  <mat-icon>favorite</mat-icon>
</button>

<!-- FAB Buttons -->
<button mat-fab>
  <mat-icon>add</mat-icon>
</button>
<button mat-mini-fab>
  <mat-icon>add</mat-icon>
</button>
```

### 4. Paginator (`paginator/paginator.component.html`)

#### Paginator Configuration
```html
<mat-paginator
  [length]="totalElements"
  [pageSize]="pageSize"
  [pageSizeOptions]="[10, 20, 50, 100]"
  [pageIndex]="pageIndex"
  [showFirstLastButtons]="true"
  (page)="onPageChange($event)">
</mat-paginator>
```

### 5. Select (`select/select.component.html`)

#### Select with Options
```html
<mat-form-field>
  <mat-label>Choose option</mat-label>
  <mat-select [(value)]="selected">
    <mat-option value="">None</mat-option>
    <mat-option *ngFor="let option of options" [value]="option.value">
      {{ option.label }}
    </mat-option>
  </mat-select>
</mat-form-field>
```

## Angular Material 20 Best Practices

### 1. **Use CDK Directives for Tables**
- `cdkColumnDef` instead of `matColumnDef`
- `*cdkHeaderCellDef` instead of `*matHeaderCellDef`
- `*cdkCellDef` instead of `*matCellDef`
- `*cdkHeaderRowDef` instead of `*matHeaderRowDef`
- `*cdkRowDef` instead of `*matRowDef`

### 2. **Control Flow Syntax**
Use Angular's new control flow:
```html
<!-- New syntax -->
@if (condition) {
  <content>
}

@for (item of items; track item.id) {
  <content>
}

<!-- Avoid old syntax -->
*ngIf="condition"
*ngFor="let item of items"
```

### 3. **Form Field Structure**
Always include proper structure:
- `<mat-form-field>` wrapper
- `<mat-label>` for labels
- `matInput` directive on inputs
- `<mat-error>` for validation messages
- `<mat-hint>` for helper text

### 4. **Icon Usage**
```html
<!-- Correct -->
<mat-icon>icon_name</mat-icon>

<!-- With button -->
<button mat-icon-button>
  <mat-icon>icon_name</mat-icon>
</button>
```

### 5. **Menu Structure**
```html
<button mat-icon-button [matMenuTriggerFor]="menu">
  <mat-icon>more_vert</mat-icon>
</button>
<mat-menu #menu="matMenu">
  <button mat-menu-item>
    <mat-icon>edit</mat-icon>
    <span>Edit</span>
  </button>
</mat-menu>
```

## Component Attribute Reference

### Table Attributes
- `mat-table` or `table[mat-table]` - Table element
- `mat-header-cell` or `th[mat-header-cell]` - Header cell
- `mat-cell` or `td[mat-cell]` - Data cell
- `mat-header-row` or `tr[mat-header-row]` - Header row
- `mat-row` or `tr[mat-row]` - Data row
- `mat-sort-header` - Sortable header
- `matSort` - Sort directive on table

### Button Attributes
- `mat-button` - Basic button
- `mat-raised-button` - Raised button
- `mat-flat-button` - Flat button
- `mat-stroked-button` - Stroked button
- `mat-icon-button` - Icon button
- `mat-fab` - Floating action button
- `mat-mini-fab` - Mini FAB

### Form Field Attributes
- `matInput` - Input directive
- `matPrefix` - Prefix position
- `matSuffix` - Suffix position
- `matSelect` - Select directive
- `matOption` - Option directive

## Common Mistakes to Avoid

1. **Don't use `matColumnDef`** - Use `cdkColumnDef`
2. **Don't use `trackBy` in `*cdkRowDef`** - Configure in DataSource
3. **Don't use `::ng-deep`** - Style globally or use proper encapsulation
4. **Don't target `.mat-mdc-*` classes** - Use attribute selectors
5. **Don't forget `mat-label`** in form fields
6. **Don't mix old `*ngFor` with new `@for`** syntax

## Migration from Older Versions

### Table Migration
```html
<!-- Old -->
<ng-container matColumnDef="name">
  <th mat-header-cell *matHeaderCellDef>Name</th>
  <td mat-cell *matCellDef="let element">{{ element.name }}</td>
</ng-container>

<!-- New -->
<ng-container cdkColumnDef="name">
  <mat-header-cell *cdkHeaderCellDef>Name</mat-header-cell>
  <mat-cell *cdkCellDef="let element">{{ element.name }}</mat-cell>
</ng-container>
```

### Control Flow Migration
```html
<!-- Old -->
<div *ngIf="loading">Loading...</div>
<div *ngFor="let item of items; trackBy: trackByFn">

<!-- New -->
@if (loading) {
  <div>Loading...</div>
}
@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
}
```

## Accessibility Guidelines

1. Always provide `aria-label` for icon-only buttons
2. Use `mat-label` instead of placeholder for form fields
3. Include proper table headers with `scope` attributes
4. Provide keyboard navigation support
5. Use semantic HTML elements

## Performance Tips

1. Use `OnPush` change detection strategy
2. Implement virtual scrolling for large lists
3. Use `trackBy` functions in DataSource
4. Lazy load Material modules
5. Use Material's CDK for custom components

---

*Last Updated: 2025-01-22*  
*Angular Material Version: 20.1.1*  
*Angular Version: 20.1.1*