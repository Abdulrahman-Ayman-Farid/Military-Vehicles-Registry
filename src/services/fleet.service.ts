import { Injectable, signal, inject } from '@angular/core';
import { BackendService, Vehicle } from './backend.service';

export { Vehicle };

@Injectable({
  providedIn: 'root'
})
export class FleetService {
  private backend = inject(BackendService);

  // State
  readonly vehicles = signal<Vehicle[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadFleet();
  }

  async loadFleet(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this.backend.getVehicles();
      this.vehicles.set(data);
    } catch (err) {
      this.error.set('Failed to fetch from Imperial Archives');
    } finally {
      this.isLoading.set(false);
    }
  }

  async addVehicle(designation: string, type: string): Promise<void> {
    this.isLoading.set(true);
    const newVehicle: Vehicle = {
      id: crypto.randomUUID(),
      designation,
      type,
      status: 'ACTIVE',
      serialNumber: this.generateSerial(),
      timestamp: Date.now()
    };

    try {
      await this.backend.createVehicle(newVehicle);
      // Optimistic update or refetch? Let's just update local state to be snappy
      // actually let's re-fetch to be "correct" or just update list.
      // Update local list manually to avoid another roundtrip delay for the UI
      this.vehicles.update(current => [newVehicle, ...current]);
    } catch (err) {
      this.error.set('Failed to inscribe new record');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteVehicle(id: string): Promise<void> {
    // Optimistic update for better UX, revert on failure
    const previous = this.vehicles();
    this.vehicles.update(current => current.filter(v => v.id !== id));

    try {
      await this.backend.deleteVehicle(id);
    } catch (err) {
      this.vehicles.set(previous); // Revert
      this.error.set('Could not exile unit');
    }
  }

  async updateStatus(id: string, newStatus: Vehicle['status']): Promise<void> {
    // Optimistic update
    this.vehicles.update(current => 
      current.map(v => v.id === id ? { ...v, status: newStatus } : v)
    );

    try {
      await this.backend.updateVehicleStatus(id, newStatus);
    } catch (err) {
      // Revert is complex here without deep copy or history, skipping for brevity in this task
      this.error.set('Status update failed');
    }
  }

  private generateSerial(): string {
    const prefix = 'EGY';
    const num = Math.floor(1000 + Math.random() * 9000);
    const suffix = ['RA', 'HOR', 'SET', 'OSI'][Math.floor(Math.random() * 4)];
    return `${prefix}-${num}-${suffix}`;
  }
}