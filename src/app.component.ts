import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { FleetService, Vehicle } from './services/fleet.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private fleetService = inject(FleetService);
  private fb: FormBuilder = inject(FormBuilder);

  // Expose signals
  isLoading = this.fleetService.isLoading;
  
  // Search State
  searchControl = new FormControl('');
  searchTerm = signal('');

  // Add Vehicle Form
  addForm = this.fb.group({
    designation: ['', [Validators.required, Validators.minLength(2)]],
    type: ['', [Validators.required, Validators.minLength(2)]]
  });

  constructor() {
    this.searchControl.valueChanges.subscribe(value => {
      this.searchTerm.set(value || '');
    });
  }

  filteredVehicles = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const allVehicles = this.fleetService.vehicles();

    if (!term) return allVehicles;

    return allVehicles.filter(v => 
      v.designation.toLowerCase().includes(term) || 
      v.type.toLowerCase().includes(term) ||
      v.serialNumber.toLowerCase().includes(term)
    );
  });

  async onSubmit() {
    if (this.addForm.valid && !this.isLoading()) {
      const { designation, type } = this.addForm.value;
      if (designation && type) {
        await this.fleetService.addVehicle(designation, type);
        this.addForm.reset({ designation: '', type: '' });
      }
    }
  }

  deleteVehicle(id: string): void {
    this.fleetService.deleteVehicle(id);
  }

  cycleStatus(id: string, currentStatus: Vehicle['status']): void {
    const statuses: Vehicle['status'][] = ['ACTIVE', 'DEPLOYED', 'MAINTENANCE'];
    const nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    this.fleetService.updateStatus(id, statuses[nextIndex]);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'text-amber-400 border-amber-500/30 bg-amber-500/10'; // Gold
      case 'DEPLOYED': return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'; // Lapis/Turquoise
      case 'MAINTENANCE': return 'text-red-500 border-red-500/30 bg-red-500/10'; // Ruby
      default: return 'text-stone-500';
    }
  }
}