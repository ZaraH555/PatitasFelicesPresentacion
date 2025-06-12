import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Mascota, MascotaFormData } from '../../models/mascota';

export interface MascotaForm extends Omit<Mascota, 'id' | 'imagen' | 'imagen_url'> {
  imagen?: File;
}

@Component({
  selector: 'app-mascota-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal" [class.show]="visible">
      <div class="modal-content">
        <h2 class="modal-title">{{mascota ? 'Editar' : 'Nueva'}} Mascota</h2>
        <form #mascotaForm="ngForm" (ngSubmit)="guardar()">
          <div class="form-group">
            <label for="nombre">Nombre</label>
            <input type="text" 
                   id="nombre" 
                   name="nombre" 
                   class="form-control" 
                   [(ngModel)]="mascotaData.nombre" 
                   required>
          </div>
          
          <div class="form-group">
            <label for="raza">Raza</label>
            <input type="text" 
                   id="raza" 
                   name="raza" 
                   class="form-control" 
                   [(ngModel)]="mascotaData.raza" 
                   required>
          </div>

          <div class="form-group">
            <label for="tamano">Tamaño</label>
            <select id="tamano" 
                    name="tamano" 
                    class="form-control"
                    [(ngModel)]="mascotaData.tamano" 
                    required>
              <option value="pequeño">Pequeño</option>
              <option value="mediano">Mediano</option>
              <option value="grande">Grande</option>
            </select>
          </div>

          <div class="form-group">
            <label for="edad">Edad</label>
            <div class="edad-group">
              <input type="number" 
                     id="edad" 
                     name="edad" 
                     class="form-control" 
                     [(ngModel)]="mascotaData.edad" 
                     min="0" 
                     required>
              <select id="tipoEdad" 
                      name="tipoEdad" 
                      class="form-control"
                      [(ngModel)]="mascotaData.tipoEdad">
                <option value="años">Años</option>
                <option value="meses">Meses</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="notas">Notas (opcional)</label>
            <textarea id="notas" 
                      name="notas" 
                      class="form-control" 
                      [(ngModel)]="mascotaData.notas"
                      rows="3"></textarea>
          </div>

          <div class="button-group">
            <button type="button" 
                    class="btn btn-secondary" 
                    (click)="cerrar()">Cancelar</button>
            <button type="submit" 
                    class="btn btn-primary" 
                    [disabled]="!mascotaForm.form.valid">
              {{mascota ? 'Actualizar' : 'Guardar'}}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }
    .modal.show { 
      display: flex;
    }
    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }
    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    .form-control:focus {
      border-color: var(--primary-color);
      outline: none;
      box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
    }
    .edad-group {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .edad-group input[type="number"] {
      width: 100px;
    }
    .edad-group select {
      width: 120px;
    }
    .button-group {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }
    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background-color: var(--primary-color);
      color: white;
    }
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    .modal-title {
      margin-bottom: 1.5rem;
      color: #333;
      text-align: center;
      font-size: 1.5rem;
    }
  `]
})
export class MascotaModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() mascota?: Mascota;
  @Output() guardarMascota = new EventEmitter<{id?: number, data: MascotaFormData}>();
  @Output() cerrarModal = new EventEmitter<void>();

  mascotaData: MascotaFormData = {
    nombre: '',
    raza: '',
    tamano: 'mediano',
    edad: 0,
    tipoEdad: 'años', // Add this default value
    notas: ''
  };

  selectedFile?: File;

  ngOnChanges() {
    if (this.mascota) {
      this.mascotaData = {
        nombre: this.mascota.nombre,
        raza: this.mascota.raza,
        tamano: this.mascota.tamano,
        edad: this.mascota.edad,
        tipoEdad: this.mascota.tipoEdad || 'años',
        notas: this.mascota.notas || ''
      };
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async guardar() {
    if (!this.mascotaData.nombre || !this.mascotaData.raza) {
      return;
    }
    try {
      await this.guardarMascota.emit({
        id: this.mascota?.id,
        data: {
          ...this.mascotaData,
          imagen: this.selectedFile
        }
      });
    } finally {
    }
  }

  cerrar() {
    this.mascotaData = {
      nombre: '',
      raza: '',
      tamano: 'mediano',
      edad: 0,
      tipoEdad: 'años',
      notas: ''
    };
    this.selectedFile = undefined;
    this.cerrarModal.emit();
  }

  onEdadChange(event: any) {
    const value = parseInt(event.target.value);
    if (value < 0) {
      this.mascotaData.edad = 0;
    } else if (this.mascotaData.tipoEdad === 'años' && value > 30) {
      this.mascotaData.edad = 30;
    } else if (this.mascotaData.tipoEdad === 'meses' && value > 360) {
      this.mascotaData.edad = 360;
    } else {
      this.mascotaData.edad = value;
    }
  }
}
