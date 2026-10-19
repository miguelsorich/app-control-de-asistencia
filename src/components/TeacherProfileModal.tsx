import React, { useState, useEffect } from 'react';
import { DocenteUsuario } from '../types';
import { X, User, Key, Save, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface TeacherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDocente: DocenteUsuario | null;
  onSaveProfile: (updatedDocente: DocenteUsuario) => void;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  isOpen,
  onClose,
  currentDocente,
  onSaveProfile,
}) => {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [codigoDocente, setCodigoDocente] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentDocente) {
      setNombreCompleto(currentDocente.nombreCompleto || '');
      setCodigoDocente(currentDocente.codigoDocente || '');
      setCorreo(currentDocente.correo || '');
      setContrasena(currentDocente.contrasena || '');
      setError(null);
      setShowPassword(false);
    }
  }, [currentDocente, isOpen]);

  if (!isOpen || !currentDocente) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nombreCompleto.trim();
    const cleanCodigo = codigoDocente.trim();
    const cleanPass = contrasena.trim();

    if (!cleanNombre) {
      setError('El nombre completo es requerido.');
      return;
    }
    if (!cleanCodigo) {
      setError('El usuario o código no puede estar vacío.');
      return;
    }
    if (!cleanPass) {
      setError('La contraseña no puede estar vacía.');
      return;
    }

    const updated: DocenteUsuario = {
      ...currentDocente,
      nombreCompleto: cleanNombre,
      codigoDocente: cleanCodigo,
      correo: correo.trim(),
      contrasena: cleanPass,
    };

    onSaveProfile(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#174EAF] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Mi Perfil y Credenciales</h3>
              <p className="text-xs text-blue-100">Modifica tu usuario y contraseña de acceso</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
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
            <label className="block text-xs font-bold text-slate-700">Nombre Completo</label>
            <input
              type="text"
              required
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Usuario de Inicio de Sesión</label>
            <input
              type="text"
              required
              value={codigoDocente}
              onChange={(e) => setCodigoDocente(e.target.value)}
              placeholder="Tu usuario o código"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
            />
            <span className="text-[10px] text-slate-400">Puedes cambiar tu usuario para ingresar más cómodamente</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Correo Electrónico</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Tu Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Nueva contraseña"
                className="w-full px-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
              <span>Guardar Mis Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
