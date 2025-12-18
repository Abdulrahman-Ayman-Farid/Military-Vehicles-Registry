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

  async addVehicle(designation: string, type: string, category: Vehicle['category']): Promise<void> {
    this.isLoading.set(true);
    
    // Auto-generate some metadata for simplicity
    const commanders = ['Cmdr. Tariq', 'Lt. Sarah', 'Col. Youssef', 'Maj. Amira', 'Sgt. Karim', 'Gen. Hassan'];
    
    const newVehicle: Vehicle = {
      id: crypto.randomUUID(),
      designation,
      type,
      category,
      status: 'ACTIVE',
      serialNumber: this.generateSerial(),
      timestamp: Date.now(),
      operator: commanders[Math.floor(Math.random() * commanders.length)],
      fuelLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
      lastMaintained: new Date().toLocaleDateString('en-GB')
    };

    try {
      await this.backend.createVehicle(newVehicle);
      this.vehicles.update(current => [newVehicle, ...current]);
    } catch (err) {
      this.error.set('Failed to inscribe new record');
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateVehicleDetails(updatedVehicle: Vehicle): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.backend.updateVehicle(updatedVehicle);
      this.vehicles.update(current => 
        current.map(v => v.id === updatedVehicle.id ? updatedVehicle : v)
      );
    } catch (err) {
      this.error.set('Failed to update vehicle log');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteVehicle(id: string): Promise<void> {
    const previous = this.vehicles();
    this.vehicles.update(current => current.filter(v => v.id !== id));

    try {
      await this.backend.deleteVehicle(id);
    } catch (err) {
      this.vehicles.set(previous); 
      this.error.set('Could not exile unit');
    }
  }

  async updateStatus(id: string, newStatus: Vehicle['status']): Promise<void> {
    this.vehicles.update(current => 
      current.map(v => v.id === id ? { ...v, status: newStatus } : v)
    );

    try {
      await this.backend.updateVehicleStatus(id, newStatus);
    } catch (err) {
      this.error.set('Status update failed');
    }
  }

  // === DATA RETENTION PROTOCOLS ===

  downloadBackup(): void {
    const data = this.backend.getRawData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `IMPERIAL_REGISTRY_BACKUP_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  async uploadBackup(file: File): Promise<void> {
    this.isLoading.set(true);
    try {
      const text = await file.text();
      this.backend.importData(text);
      await this.loadFleet(); // Reload state from the new DB data
    } catch (e) {
      this.error.set('Restoration Protocol Failed: Corrupt Data');
    } finally {
      this.isLoading.set(false);
    }
  }

  private generateSerial(): string {
    const prefix = 'EGY';
    const num = Math.floor(1000 + Math.random() * 9000);
    const suffix = ['A', 'B', 'C', 'X'][Math.floor(Math.random() * 4)];
    return `${prefix}-${num}-${suffix}`;
  }
}