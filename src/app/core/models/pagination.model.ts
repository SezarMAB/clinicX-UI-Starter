/**
 * Sort direction enum
 * @enum SortDirection
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Sort information
 * @interface Sort
 */
export interface Sort {
  /** Whether the results are sorted */
  sorted: boolean;
  /** Whether the results are unsorted */
  unsorted: boolean;
  /** Whether the sort is empty */
  empty: boolean;
}

/**
 * Pageable request parameters
 * @interface PageableRequest
 */
export interface PageableRequest {
  /** Zero-based page index */
  page?: number;
  /** The size of the page to be returned */
  size?: number;
  /** Sorting criteria: property(,asc|desc) */
  sort?: string | string[];
}

/**
 * Pageable response information
 * @interface Pageable
 */
export interface Pageable {
  /** Current page number (zero-based) */
  page: number;
  /** Page size */
  size: number;
  /** Sort criteria */
  sort: string;
  /** Sort direction */
  direction?: 'asc' | 'desc';
}

/**
 * Generic paginated response
 * @template T The type of content items
 * @interface Page
 */
export interface Page<T> {
  /** Page content */
  content: T[];
  /** Total number of elements across all pages */
  totalElements: number;
  /** Total number of pages */
  totalPages: number;
  /** Current page number (zero-based) */
  number: number;
  /** Page size */
  size: number;
  /** Number of elements in the current page */
  numberOfElements: number;
  /** Whether this is the first page */
  first: boolean;
  /** Whether this is the last page */
  last: boolean;
  /** Whether the page is empty */
  empty: boolean;
  /** Sort information */
  sort: Sort;
  /** Pageable information */
  pageable: Pageable;
}

/**
 * Enhanced pagination model with additional utilities
 * @template T The type of content items
 * @class EnhancedPage
 */
export class EnhancedPage<T> implements Page<T> {
  content: T[] = [];
  totalElements = 0;
  totalPages = 0;
  number = 0;
  size = 20;
  numberOfElements = 0;
  first = true;
  last = true;
  empty = true;
  sort: Sort = { sorted: false, unsorted: true, empty: true };
  pageable: Pageable = { page: 0, size: 20, sort: '' };

  constructor(page?: Partial<Page<T>>) {
    if (page) {
      Object.assign(this, page);
    }
  }

  /**
   * Get the current page number (1-based for display)
   * @returns Current page number for display
   */
  get currentPage(): number {
    return this.number + 1;
  }

  /**
   * Check if there's a previous page
   * @returns True if previous page exists
   */
  get hasPrevious(): boolean {
    return !this.first;
  }

  /**
   * Check if there's a next page
   * @returns True if next page exists
   */
  get hasNext(): boolean {
    return !this.last;
  }

  /**
   * Get the range of items being displayed
   * @returns Object with from and to indices
   */
  get displayRange(): { from: number; to: number } {
    if (this.empty) {
      return { from: 0, to: 0 };
    }
    const from = this.number * this.size + 1;
    const to = from + this.numberOfElements - 1;
    return { from, to };
  }

  /**
   * Get page numbers for pagination UI
   * @param maxPages Maximum number of page buttons to show
   * @returns Array of page numbers
   */
  getPageNumbers(maxPages = 5): number[] {
    const pages: number[] = [];
    const half = Math.floor(maxPages / 2);
    let start = Math.max(0, this.number - half);
    const end = Math.min(this.totalPages - 1, start + maxPages - 1);

    if (end - start < maxPages - 1) {
      start = Math.max(0, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i + 1); // Convert to 1-based for display
    }

    return pages;
  }

  /**
   * Create pageable request parameters
   * @param page Page number (0-based)
   * @param size Page size
   * @param sort Sort criteria
   * @returns PageableRequest object
   */
  static createRequest(page = 0, size = 20, sort?: string | string[]): PageableRequest {
    return { page, size, sort };
  }

  /**
   * Parse sort string into property and direction
   * @param sort Sort string (e.g., "name,asc")
   * @returns Object with property and direction
   */
  static parseSort(sort: string): { property: string; direction: SortDirection } {
    const parts = sort.split(',');
    return {
      property: parts[0] || '',
      direction: parts[1] === 'desc' ? SortDirection.DESC : SortDirection.ASC,
    };
  }

  /**
   * Build sort string from property and direction
   * @param property Sort property
   * @param direction Sort direction
   * @returns Sort string
   */
  static buildSort(property: string, direction: SortDirection = SortDirection.ASC): string {
    return `${property},${direction}`;
  }
}
