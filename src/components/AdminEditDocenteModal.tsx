import React, { useState, useEffect } from 'react';
import { DocenteUsuario } from '../types';
import { X, Key, Save, AlertCircle, Shield } from 'lucide-react';

interface AdminEditDocenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  docente: DocenteUsuario | null;
  onUpdateDocente: (updatedDocente: DocenteUsuario) => void;
}

export const AdminEditDocenteModal: React.FC<AdminEditDocenteModalProps> = ({
  isOpen,
  onClose,
  docente,
  onUpdateDocente,
}) => {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [codigoDocente, setCodigoDocente] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [carrera, setCarrera] = useState('');
  const [telefono, setTelefono] = useState('');
  const [activo, setActivo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (docente) {
      setNombreCompleto(docente.nombreCompleto || '');
      setCodigoDocente(docente.codigoDocente || '');
      setCorreo(docente.correo || '');
      setContrasena(docente.contrasena || '');
      setCarrera(docente.carrera || 'Contaduría Pública');
      setTelefono(docente.telefono || '');
      setActivo(docente.activo !== false);
      setError(null);
    }
  }, [docente]);

  if (!isOpen || !docente) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim()) {
      setError('El nombre completo es requerido.');
      return;
    }
    if (!contrasena.trim()) {
      setError('La contraseña no puede estar vacía.');
      return;
    }

    const updated: DocenteUsuario = {
      ...docente,
      nombreCompleto: nombreCompleto.trim(),
      codigoDocente: codigoDocente.trim(),
      correo: correo.trim(),
      contrasena: contrasena.trim(),
      carrera: carrera.trim(),
      telefono: telefono.trim() || undefined,
      activo,
    };

    onUpdateDocente(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#172033] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Editar Credenciales Docente</h3>
              <p className="text-xs text-slate-400">{docente.codigoDocente} • {docente.nombreCompleto}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Usuario / Código Docente
              </label>
              <input
                type="text"
                required
                value={codigoDocente}
                onChange={(e) => setCodigoDocente(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Nueva Contraseña
              </label>
              <input
                type="text"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Teléfono / Celular
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Carrera / Área Académica *
              </label>
              <span className="text-[11px] font-semibold text-[#174EAF] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Puedes escribirla a mano
              </span>
            </div>
            <input
              type="text"
              required
              list="carreras-edit-list"
              value={carrera}
              onChange={(e) => setCarrera(e.target.value)}
              placeholder="Escribe a mano la carrera (ej. Contaduría Pública...)"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
            />
            <datalist id="carreras-edit-list">
              <option value="Contaduría Pública" />
              <option value="Auditoría Financiera" />
              <option value="Sistemas de Control de Gestión" />
              <option value="Ingeniería Financiera" />
              <option value="Administración de Empresas" />
              <option value="Ingeniería Comercial" />
              <option value="Ingeniería Informática / Sistemas" />
              <option value="Ciencias Exactas" />
              <option value="Economía" />
              <option value="Facultad de Ciencias Contables" />
            </datalist>
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-500 font-medium">Sugerencias rápidas:</span>
              {[
                'Contaduría Pública',
                'Auditoría Financiera',
                'Ingeniería Financiera',
                'Adm. de Empresas',
                'Ing. Sistemas',
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCarrera(item)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-[#174EAF] transition-colors border border-slate-200 cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="check-docente-activo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-4 h-4 rounded text-[#174EAF] focus:ring-[#174EAF]"
            />
            <label htmlFor="check-docente-activo" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Docente Activo (habilitado para iniciar sesión en el portal)
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#174EAF] hover:bg-[#103B88] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
