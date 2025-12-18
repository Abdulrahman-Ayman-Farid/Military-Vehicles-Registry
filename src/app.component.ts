import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl, FormGroup } from '@angular/forms';
import { FleetService, Vehicle } from './services/fleet.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    @keyframes progress {
      0% { width: 0%; opacity: 1; }
      50% { width: 70%; opacity: 1; }
      100% { width: 100%; opacity: 0; }
    }
    .animate-progress {
      animation: progress 1s ease-in-out infinite;
    }
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    /* Arabic font fallback */
    .font-arabic {
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    /* Range Slider Styling */
    input[type=range] {
      -webkit-appearance: none;
      background: transparent;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 16px;
      width: 4px;
      border-radius: 1px;
      background: #d4af37;
      margin-top: -6px;
      box-shadow: 0 0 5px #d4af37;
      cursor: pointer;
    }
    input[type=range]::-webkit-slider-runnable-track {
      width: 100%;
      height: 4px;
      background: #292524;
      border-radius: 2px;
    }
  `],
  template: `
    <div class="min-h-screen bg-[#0c0a09] text-stone-300 relative font-mono selection:bg-[#d4af37] selection:text-black pb-20">
      
      <!-- Background Texture Overlay -->
      <div class="fixed inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] z-0"></div>

      <!-- Loading Line -->
      @if (isLoading()) {
        <div class="fixed top-0 left-0 w-full h-1 bg-stone-900 z-50">
          <div class="h-full bg-[#d4af37] animate-progress"></div>
        </div>
      }

      <!-- Header -->
      <header class="relative z-10 max-w-7xl mx-auto px-6 py-10 border-b border-[#d4af37]/20 mb-10 bg-gradient-to-b from-[#141210] to-transparent">
        <div class="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <!-- Title Section -->
          <div class="text-center md:text-left relative">
            <div class="absolute -left-6 top-1 bottom-1 w-1 bg-[#d4af37]"></div>
            <h1 class="text-4xl md:text-5xl font-bold text-[#d4af37] uppercase tracking-widest font-egypt flex flex-col gap-1 drop-shadow-md">
              <span>Imperial Registry</span>
              <span class="text-3xl md:text-4xl font-arabic font-bold text-[#e7e5e4] mt-1" dir="rtl">السجل العسكري</span>
            </h1>
            <div class="flex items-center justify-center md:justify-start gap-3 mt-3 text-[10px] tracking-[0.2em] text-[#a8a29e] uppercase">
               <span>Pharaoh_Node_01</span>
               <span class="text-[#d4af37]">◆</span>
               <span>Official Database</span>
            </div>
          </div>

          <!-- Status Badge -->
          <div class="flex items-center gap-4 px-6 py-3 border border-[#d4af37]/30 bg-[#1c1917]/80 backdrop-blur-md rounded-sm text-sm text-[#d4af37] tracking-wider shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-[#d4af37]"></span>
            </span>
            <div class="flex flex-col items-start leading-none gap-1">
              <span class="font-bold">SYSTEM ONLINE</span>
              <span class="font-arabic font-bold text-xs">النظام متصل</span>
            </div>
          </div>
        </div>
      </header>

      <main class="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Sidebar: Controls -->
        <div class="lg:col-span-4 space-y-8">
          
          <!-- Search -->
          <div class="bg-[#141210] border border-[#292524] p-1 shadow-lg shadow-black/40 group focus-within:border-[#d4af37] transition-colors">
            <div class="relative">
              <input 
                type="text" 
                [formControl]="searchControl"
                placeholder="SEARCH ID / بحث..." 
                class="w-full bg-[#0c0a09] text-[#d4af37] pl-4 pr-10 py-4 text-base focus:outline-none placeholder-stone-600 font-mono uppercase font-bold"
              >
              <div class="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-[#d4af37]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
              </div>
            </div>
          </div>

          <!-- Add Vehicle -->
          <div class="bg-[#141210] border-y-2 border-[#d4af37]/20 p-8 shadow-2xl relative">
             <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0c0a09] px-3 border border-[#d4af37]/20 text-[#d4af37] text-[10px] tracking-widest uppercase">
              Secure Uplink
            </div>

            <div class="flex items-center justify-between mb-8 border-b border-stone-800 pb-2">
              <span class="text-xs uppercase tracking-widest text-[#a8a29e]">New Entry</span>
              <span class="text-lg font-arabic font-bold text-[#e7e5e4]">إدخال جديد</span>
            </div>
            
            <form [formGroup]="addForm" (ngSubmit)="onSubmit()" class="space-y-6">
              <div class="space-y-2">
                <div class="flex justify-between">
                   <label class="text-[10px] uppercase text-[#d4af37] tracking-wider">Designation</label>
                   <label class="text-sm font-arabic text-stone-400">التسمية</label>
                </div>
                <input 
                  type="text" 
                  formControlName="designation"
                  class="w-full bg-[#0c0a09] border border-stone-800 text-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] transition-colors uppercase placeholder-stone-800"
                  placeholder="UNIT-ALPHA-1"
                >
              </div>
              
              <div class="space-y-2">
                 <div class="flex justify-between">
                   <label class="text-[10px] uppercase text-[#d4af37] tracking-wider">Class</label>
                   <label class="text-sm font-arabic text-stone-400">الفئة</label>
                </div>
                <input 
                  type="text" 
                  formControlName="type"
                  class="w-full bg-[#0c0a09] border border-stone-800 text-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-[#d4af37] transition-colors uppercase placeholder-stone-800"
                  placeholder="HEAVY ASSAULT"
                >
              </div>

              <button 
                type="submit"
                [disabled]="addForm.invalid || isLoading()"
                class="w-full mt-6 bg-[#d4af37] hover:bg-[#f59e0b] text-black font-bold py-4 text-sm uppercase tracking-[0.15em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]"
              >
                @if(isLoading()) { 
                  <span>PROCESSING...</span> 
                } @else { 
                  <span>INSCRIBE RECORD</span>
                  <span class="font-arabic font-extrabold text-lg">تسجيل الوحدة</span>
                }
              </button>
            </form>
          </div>

          <!-- Simplified Stats -->
          <div class="bg-gradient-to-r from-[#141210] to-[#1c1917] border border-[#292524] p-6 flex items-center justify-between shadow-lg">
            <div class="flex flex-col gap-1">
              <span class="text-[10px] uppercase text-[#a8a29e] tracking-widest">Total Fleet Strength</span>
              <span class="text-lg font-arabic font-bold text-[#e7e5e4]">إجمالي الأسطول</span>
            </div>
            <div class="text-4xl font-egypt text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]">{{ filteredVehicles().length }}</div>
          </div>

        </div>

        <!-- Main Content: List -->
        <div class="lg:col-span-8">
          
          <div class="flex items-center justify-between mb-8 pb-4 border-b border-[#d4af37]/30">
            <div class="flex items-center gap-3">
              <div class="w-1.5 h-6 bg-[#d4af37]"></div>
              <h2 class="text-base font-bold uppercase tracking-widest text-[#e7e5e4]">Active Registry</h2>
            </div>
            <span class="text-xl font-arabic font-bold text-[#d4af37]">الوحدات النشطة</span>
          </div>

          <div class="space-y-6">
            @for (vehicle of filteredVehicles(); track vehicle.id) {
              
              <!-- Vehicle Card -->
              <div class="group relative bg-[#141210] border border-[#292524] transition-all duration-300 animate-fade-in flex flex-col md:flex-row shadow-lg hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                   [class.border-[#d4af37]]="editingId() === vehicle.id"
                   [class.hover:border-[#d4af37]/50]="editingId() !== vehicle.id">
                
                <!-- Card Decorative Corner -->
                <div class="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-[#1c1917] border-l-[40px] border-l-transparent"></div>
                
                @if (editingId() === vehicle.id) {
                  <!-- EDIT MODE -->
                  <div class="w-full p-6 bg-[#1c1917]" [formGroup]="editForm">
                    
                    <div class="flex items-center justify-between mb-6 border-b border-stone-700 pb-2">
                      <span class="text-[#d4af37] font-bold uppercase tracking-wider">Modifying Record</span>
                      <span class="font-arabic text-[#d4af37] font-bold">تعديل البيانات</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <!-- ID -->
                      <div class="space-y-1">
                        <label class="text-[10px] text-[#a8a29e] uppercase tracking-wider block">Serial ID</label>
                        <input formControlName="serialNumber" type="text" class="w-full bg-black/50 border border-stone-700 text-[#d4af37] px-3 py-2 font-mono font-bold focus:outline-none focus:border-[#d4af37]">
                      </div>
                       <!-- Status -->
                       <div class="space-y-1">
                        <label class="text-[10px] text-[#a8a29e] uppercase tracking-wider block">Status / الحالة</label>
                        <select formControlName="status" class="w-full bg-black/50 border border-stone-700 text-stone-300 px-3 py-2 font-arabic font-bold focus:outline-none focus:border-[#d4af37]">
                          <option value="ACTIVE">ACTIVE / نشط</option>
                          <option value="MAINTENANCE">MAINTENANCE / صيانة</option>
                          <option value="DEPLOYED">DEPLOYED / منتشر</option>
                        </select>
                      </div>
                      <!-- Designation -->
                      <div class="space-y-1">
                        <label class="text-[10px] text-[#a8a29e] uppercase tracking-wider block">Designation / التسمية</label>
                        <input formControlName="designation" type="text" class="w-full bg-black/50 border border-stone-700 text-stone-200 px-3 py-2 uppercase font-bold focus:outline-none focus:border-[#d4af37]">
                      </div>
                      <!-- Type -->
                      <div class="space-y-1">
                        <label class="text-[10px] text-[#a8a29e] uppercase tracking-wider block">Class / الفئة</label>
                        <input formControlName="type" type="text" class="w-full bg-black/50 border border-stone-700 text-stone-200 px-3 py-2 uppercase font-bold focus:outline-none focus:border-[#d4af37]">
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                       <!-- Commander -->
                       <div class="space-y-1">
                        <label class="text-[10px] text-[#a8a29e] uppercase tracking-wider block">Commander / القائد</label>
                        <input formControlName="operator" type="text" class="w-full bg-black/50 border border-stone-700 text-stone-200 px-3 py-2 font-arabic focus:outline-none focus:border-[#d4af37]">
                      </div>
                      <!-- Service -->
                      <div class="space-y-1">
                        <label class="text-[10px] text-[#a8a29e] uppercase tracking-wider block">Service / صيانة</label>
                        <input formControlName="lastMaintained" type="text" class="w-full bg-black/50 border border-stone-700 text-stone-200 px-3 py-2 focus:outline-none focus:border-[#d4af37]">
                      </div>
                       <!-- Fuel -->
                       <div class="space-y-1">
                        <label class="text-[10px] text-[#a8a29e] uppercase tracking-wider block">Fuel / الوقود ({{ editForm.get('fuelLevel')?.value }}%)</label>
                        <input formControlName="fuelLevel" type="range" min="0" max="100" class="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#d4af37]">
                      </div>
                    </div>

                    <div class="flex justify-end gap-3 border-t border-stone-700 pt-4">
                      <button (click)="cancelEdit()" class="px-6 py-3 border border-stone-600 text-stone-400 text-xs font-bold hover:bg-stone-800 hover:text-stone-200 uppercase tracking-wider transition-colors">Cancel</button>
                      <button (click)="saveEdit()" class="px-6 py-3 bg-[#d4af37] text-black text-xs font-extrabold hover:bg-[#fbbf24] uppercase tracking-wider transition-colors shadow-lg">Save Changes</button>
                    </div>
                  </div>

                } @else {
                  <!-- DISPLAY MODE (Original) -->
                  
                  <!-- ID & Status Section -->
                  <div class="md:w-[28%] bg-[#0f0e0d] p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#292524] relative overflow-hidden">
                     <!-- Subtle Accent Line -->
                     <div class="absolute top-0 left-0 w-1 h-full" [class]="getBorderColor(vehicle.status)"></div>

                    <div>
                      <div class="text-[#d4af37] text-sm font-mono font-bold tracking-tight mb-2 opacity-80">{{ vehicle.serialNumber }}</div>
                      <div class="text-xl font-bold text-[#e7e5e4] uppercase leading-none mb-1 font-egypt">{{ vehicle.designation }}</div>
                      <div class="text-xs text-[#a8a29e] uppercase tracking-widest font-semibold">{{ vehicle.type }}</div>
                    </div>
                    
                    <div class="mt-6">
                      <div 
                        class="w-full text-center py-2 px-3 border transition-all uppercase tracking-wider backdrop-blur-sm"
                        [class]="getStatusClasses(vehicle.status)"
                      >
                        <div class="text-[10px] font-bold mb-0.5">{{ vehicle.status }}</div>
                        <div class="font-arabic font-bold text-sm">{{ getArabicStatus(vehicle.status) }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Metadata Section -->
                  <div class="md:w-[72%] p-6 flex flex-col justify-between relative">
                    
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                      
                      <!-- Field: Operator -->
                      <div (click)="startEdit(vehicle)" class="cursor-pointer hover:bg-[#1c1917] p-2 -m-2 rounded transition-colors group/edit">
                        <div class="flex flex-col mb-1">
                          <span class="text-[10px] uppercase text-[#78716c] tracking-widest font-bold">Commander</span>
                          <span class="text-sm font-arabic font-bold text-[#a8a29e]">القائد</span>
                        </div>
                        <div class="text-sm text-[#e7e5e4] font-medium flex items-center gap-2 font-arabic">
                          {{ vehicle.operator }}
                        </div>
                      </div>

                      <!-- Field: Maintenance -->
                      <div (click)="startEdit(vehicle)" class="cursor-pointer hover:bg-[#1c1917] p-2 -m-2 rounded transition-colors">
                        <div class="flex flex-col mb-1">
                          <span class="text-[10px] uppercase text-[#78716c] tracking-widest font-bold">Last Service</span>
                          <span class="text-sm font-arabic font-bold text-[#a8a29e]">صيانة</span>
                        </div>
                        <div class="text-sm text-[#e7e5e4] font-mono">{{ vehicle.lastMaintained }}</div>
                      </div>

                      <!-- Field: Fuel -->
                      <div (click)="startEdit(vehicle)" class="col-span-2 md:col-span-1 cursor-pointer hover:bg-[#1c1917] p-2 -m-2 rounded transition-colors">
                         <div class="flex flex-col mb-1">
                          <span class="text-[10px] uppercase text-[#78716c] tracking-widest font-bold">Fuel Level</span>
                          <span class="text-sm font-arabic font-bold text-[#a8a29e]">الوقود</span>
                        </div>
                        <div class="flex items-center gap-3">
                          <div class="flex-1 h-2 bg-[#292524] rounded-sm overflow-hidden border border-[#44403c]">
                            <div class="h-full transition-all duration-500" 
                                 [style.width.%]="vehicle.fuelLevel"
                                 [class.bg-emerald-500]="vehicle.fuelLevel > 50"
                                 [class.bg-amber-500]="vehicle.fuelLevel <= 50 && vehicle.fuelLevel > 20"
                                 [class.bg-red-600]="vehicle.fuelLevel <= 20">
                            </div>
                          </div>
                          <span class="text-sm text-[#e7e5e4] font-mono font-bold">{{ vehicle.fuelLevel }}%</span>
                        </div>
                      </div>

                    </div>

                    <!-- Actions -->
                    <div class="mt-8 pt-4 border-t border-[#292524] flex justify-end items-center gap-6">
                      
                      <!-- Edit Button -->
                      <button 
                        (click)="startEdit(vehicle)"
                        class="text-[#78716c] hover:text-[#d4af37] transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 group/btn"
                      >
                         <span class="group-hover/btn:underline decoration-[#d4af37]/50 underline-offset-4">Update Intel</span>
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                           <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                         </svg>
                      </button>

                      <button 
                        (click)="deleteVehicle(vehicle.id)"
                        class="text-[#78716c] hover:text-red-500 transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 group/btn"
                      >
                        <span class="group-hover/btn:underline decoration-red-500/50 underline-offset-4">Terminate</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                }

              </div>
            } @empty {
              <div class="py-20 flex flex-col items-center justify-center text-stone-600 border border-dashed border-[#292524] bg-[#141210]/50">
                 @if(isLoading()) {
                   <div class="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-4"></div>
                   <p class="text-xs uppercase tracking-widest font-bold">Accessing Database...</p>
                 } @else {
                   <p class="text-sm uppercase tracking-widest mb-2 font-bold text-[#a8a29e]">No Units Found</p>
                   <p class="text-lg font-arabic font-bold text-[#78716c]">لا توجد وحدات</p>
                 }
              </div>
            }
          </div>

        </div>
      </main>
    </div>
  `
})
export class AppComponent {
  private fleetService = inject(FleetService);
  private fb: FormBuilder = inject(FormBuilder);

  isLoading = this.fleetService.isLoading;
  searchControl = new FormControl('');
  searchTerm = signal('');

  // Add Vehicle Form
  addForm = this.fb.group({
    designation: ['', [Validators.required, Validators.minLength(2)]],
    type: ['', [Validators.required, Validators.minLength(2)]]
  });

  // Edit Vehicle Form
  editingId = signal<string | null>(null);
  editForm = this.fb.group({
    id: [''],
    timestamp: [0],
    serialNumber: ['', Validators.required],
    designation: ['', Validators.required],
    type: ['', Validators.required],
    operator: ['', Validators.required],
    lastMaintained: ['', Validators.required],
    fuelLevel: [0, [Validators.min(0), Validators.max(100)]],
    status: ['ACTIVE' as Vehicle['status'], Validators.required]
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
      v.serialNumber.toLowerCase().includes(term) ||
      v.operator.toLowerCase().includes(term)
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
    if (this.editingId() === id) {
      this.cancelEdit();
    }
    this.fleetService.deleteVehicle(id);
  }

  // Edit Mode Logic
  startEdit(vehicle: Vehicle): void {
    this.editingId.set(vehicle.id);
    this.editForm.patchValue({
      id: vehicle.id,
      timestamp: vehicle.timestamp,
      serialNumber: vehicle.serialNumber,
      designation: vehicle.designation,
      type: vehicle.type,
      operator: vehicle.operator,
      lastMaintained: vehicle.lastMaintained,
      fuelLevel: vehicle.fuelLevel,
      status: vehicle.status
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editForm.reset();
  }

  async saveEdit(): Promise<void> {
    if (this.editForm.valid && !this.isLoading()) {
      const updatedVehicle = this.editForm.value as Vehicle;
      await this.fleetService.updateVehicleDetails(updatedVehicle);
      this.editingId.set(null);
    }
  }

  getStatusClasses(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'text-cyan-400 border-cyan-900/50 bg-cyan-950/30 shadow-[0_0_10px_rgba(34,211,238,0.1)]'; // Turquoise/Nile
      case 'DEPLOYED': return 'text-[#d4af37] border-[#d4af37]/40 bg-[#d4af37]/10 shadow-[0_0_10px_rgba(212,175,55,0.1)]'; // Gold/Desert
      case 'MAINTENANCE': return 'text-rose-500 border-rose-900/50 bg-rose-950/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]'; // Red/Danger
      default: return 'text-stone-500';
    }
  }

  getBorderColor(status: string): string {
     switch (status) {
      case 'ACTIVE': return 'bg-cyan-500';
      case 'DEPLOYED': return 'bg-[#d4af37]';
      case 'MAINTENANCE': return 'bg-rose-600';
      default: return 'bg-stone-500';
    }
  }

  getArabicStatus(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'نشط';
      case 'DEPLOYED': return 'منتشر';
      case 'MAINTENANCE': return 'صيانة';
      default: return 'غير معروف';
    }
  }
}