import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import {
  ToothDataMap,
  ToothData,
  SurfaceState,
  Finding,
  CARIES_COLORS,
  UPPER_TEETH,
  LOWER_TEETH,
  FINDINGS,
} from './tooth-chart.models';

@Component({
  selector: 'app-tooth-chart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './tooth-chart.component.html',
  styleUrls: ['./tooth-chart.component.scss'],
})
export class ToothChartComponent implements OnInit {
  // Constants
  readonly upperTeeth = UPPER_TEETH;
  readonly lowerTeeth = LOWER_TEETH;
  readonly findings = FINDINGS;
  readonly cariesColors = CARIES_COLORS;

  // Reactive state
  toothData = signal<ToothDataMap>({});
  selectedTooth = signal<number | null>(null);
  activeSurfaceSelection = signal<string[]>([]);

  // Form controls
  fremdarbeit = false;
  ersetzen = false;
  roentgen = false;
  selectedCaries: string | null = null;
  behandlungsbedarf = '';
  fuellmaterial = '';

  // Computed values
  selectedToothData = computed(() => {
    const tooth = this.selectedTooth();
    return tooth ? this.toothData()[tooth] : null;
  });

  areSurfaceSectionsEnabled = computed(() => {
    return this.activeSurfaceSelection().length > 0;
  });

  ngOnInit(): void {
    this.initializeToothData();
  }

  private initializeToothData(): void {
    const surfaceIds = ['m', 'd', 'o', 'b', 'p', 'roots', 'a'];
    const data: ToothDataMap = {};

    [...UPPER_TEETH, ...LOWER_TEETH].forEach(toothNum => {
      data[toothNum] = {
        surfaces: {},
        findings: [],
      };
      surfaceIds.forEach(id => {
        data[toothNum].surfaces[id] = this.createDefaultSurfaceState();
      });
    });

    this.toothData.set(data);
  }

  private createDefaultSurfaceState(): SurfaceState {
    return {
      caries: null,
      behandlungsbedarf: '',
      fuellmaterial: '',
      flags: {
        fremdarbeit: false,
        ersetzen: false,
        roentgen: false,
      },
    };
  }

  selectTooth(toothNum: number): void {
    if (this.selectedTooth() === toothNum) {
      return;
    }

    this.activeSurfaceSelection.set([]);
    this.selectedTooth.set(toothNum);
    this.updateSidebarForSelection();
  }

  toggleSurfaceSelection(surfaceId: string): void {
    const current = this.activeSurfaceSelection();
    const index = current.indexOf(surfaceId);

    if (index > -1) {
      this.activeSurfaceSelection.set(current.filter(id => id !== surfaceId));
    } else {
      this.activeSurfaceSelection.set([...current, surfaceId]);
    }

    this.updateSidebarForSelection();
  }

  isSurfaceSelected(surfaceId: string): boolean {
    return this.activeSurfaceSelection().includes(surfaceId);
  }

  getSurfaceFillColor(toothNum: number, surfaceId: string): string {
    const data = this.toothData()[toothNum];
    if (!data) return 'white';

    const surfaceData = data.surfaces[surfaceId];
    return surfaceData?.caries ? this.cariesColors[surfaceData.caries] : 'white';
  }

  addFindingToTooth(finding: Finding): void {
    const tooth = this.selectedTooth();
    if (!tooth) {
      alert('Bitte wählen Sie zuerst einen Zahn aus.');
      return;
    }

    this.toothData.update(data => {
      const toothData = data[tooth];
      if (!toothData.findings.includes(finding.id)) {
        toothData.findings.push(finding.id);
      }
      return { ...data };
    });
  }

  removeFindingFromTooth(findingId: string): void {
    const tooth = this.selectedTooth();
    if (!tooth) return;

    this.toothData.update(data => {
      const toothData = data[tooth];
      toothData.findings = toothData.findings.filter(id => id !== findingId);
      return { ...data };
    });
  }

  getFindingById(findingId: string): Finding | undefined {
    return this.findings.find(f => f.id === findingId);
  }

  onCariesChange(value: string): void {
    if (this.activeSurfaceSelection().length === 0) return;

    const tooth = this.selectedTooth();
    if (!tooth) return;

    this.toothData.update(data => {
      this.activeSurfaceSelection().forEach(surfaceId => {
        data[tooth].surfaces[surfaceId].caries = value;
      });
      return { ...data };
    });

    // Clear selection after applying caries
    this.activeSurfaceSelection.set([]);
    this.updateSidebarForSelection();
  }

  onCheckboxChange(field: 'fremdarbeit' | 'ersetzen' | 'roentgen', value: boolean): void {
    if (this.activeSurfaceSelection().length === 0 || !this.selectedTooth()) return;

    const tooth = this.selectedTooth()!;
    this.toothData.update(data => {
      this.activeSurfaceSelection().forEach(surfaceId => {
        data[tooth].surfaces[surfaceId].flags[field] = value;
      });
      return { ...data };
    });

    this.updateSidebarForSelection();
  }

  onSelectChange(field: 'behandlungsbedarf' | 'fuellmaterial', value: string): void {
    if (this.activeSurfaceSelection().length === 0 || !this.selectedTooth()) return;

    const tooth = this.selectedTooth()!;
    this.toothData.update(data => {
      this.activeSurfaceSelection().forEach(surfaceId => {
        data[tooth].surfaces[surfaceId][field] = value;
      });
      return { ...data };
    });

    this.updateSidebarForSelection();
  }

  private updateSidebarForSelection(): void {
    const surfaces = this.activeSurfaceSelection();
    const tooth = this.selectedTooth();

    if (surfaces.length === 0 || !tooth) {
      // Reset all controls
      this.fremdarbeit = false;
      this.ersetzen = false;
      this.roentgen = false;
      this.selectedCaries = null;
      this.behandlungsbedarf = '';
      this.fuellmaterial = '';
      return;
    }

    const data = this.toothData()[tooth];
    const firstSurface = data.surfaces[surfaces[0]];

    // Check if all selected surfaces have the same values
    const allSame = <T>(getter: (s: SurfaceState) => T): boolean => {
      const firstValue = getter(firstSurface);
      return surfaces.every(id => {
        const surface = data.surfaces[id];
        return getter(surface) === firstValue;
      });
    };

    // Update form controls based on selection
    this.fremdarbeit = allSame(s => s.flags.fremdarbeit) ? firstSurface.flags.fremdarbeit : false;
    this.ersetzen = allSame(s => s.flags.ersetzen) ? firstSurface.flags.ersetzen : false;
    this.roentgen = allSame(s => s.flags.roentgen) ? firstSurface.flags.roentgen : false;
    this.selectedCaries = allSame(s => s.caries) ? firstSurface.caries : null;
    this.behandlungsbedarf = allSame(s => s.behandlungsbedarf)
      ? firstSurface.behandlungsbedarf
      : '';
    this.fuellmaterial = allSame(s => s.fuellmaterial) ? firstSurface.fuellmaterial : '';
  }

  async importData(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedData = JSON.parse(text) as ToothDataMap;

      if (typeof importedData !== 'object') {
        throw new Error('Invalid data format');
      }

      // Reset selection
      this.selectedTooth.set(null);
      this.activeSurfaceSelection.set([]);

      // Initialize with default data first
      this.initializeToothData();

      // Merge imported data
      this.toothData.update(data => {
        Object.keys(importedData).forEach(toothNum => {
          const num = parseInt(toothNum);
          if (data[num]) {
            Object.assign(data[num], importedData[num]);
          }
        });
        return { ...data };
      });

      this.updateSidebarForSelection();
    } catch (error) {
      alert('Fehler beim Importieren der Daten: ' + (error as Error).message);
    }

    // Reset file input
    input.value = '';
  }

  exportData(): void {
    const dataStr = JSON.stringify(this.toothData(), null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zahnstatus.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  getSurfacePath(surfaceId: string): string {
    const surfaces: { [key: string]: string } = {
      roots:
        'M15 55 L32 55 L32 70 A5 5 0 0 1 27 75 L20 75 A5 5 0 0 1 15 70 Z M38 55 L55 55 L55 70 A5 5 0 0 1 50 75 L43 75 A5 5 0 0 1 38 70 Z',
      a: 'M25 20 L45 20 L45 45 L25 45 Z',
      m: 'M15 25 A10 10 0 0 0 10 35 L10 45 A10 10 0 0 0 15 55 L25 45 L25 35 Z',
      d: 'M55 25 A10 10 0 0 1 60 35 L60 45 A10 10 0 0 1 55 55 L45 45 L45 35 Z',
      o: 'M18 25 L52 25 A3 3 0 0 1 55 28 L45 35 L25 35 L15 28 A3 3 0 0 1 18 25 Z',
      b: 'M25 35 L45 35 L45 45 L25 45 Z',
      p: 'M25 45 L45 45 L55 55 L15 55 Z',
    };
    return surfaces[surfaceId] || '';
  }
}
