import React, { useState } from 'react';
import { DocenteUsuario } from '../types';
import { X, Key, UserCheck, Eye, EyeOff, Save, AlertCircle, Shield } from 'lucide-react';

interface TeacherChangeCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDocente: DocenteUsuario | null;
  onUpdateDocente: (updatedDocente: DocenteUsuario) => void;
}

export const TeacherChangeCredentialsModal: React.FC<TeacherChangeCredentialsModalProps> = ({
  isOpen,
  onClose,
  currentDocente,
  onUpdateDocente,
}) => {
  const [nombreCompleto, setNombreCompleto] = useState(currentDocente?.nombreCompleto || '');
  const [codigoDocente, setCodigoDocente] = useState(currentDocente?.codigoDocente || '');
  const [correo, setCorreo] = useState(currentDocente?.correo || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !currentDocente) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNombre = nombreCompleto.trim();
    const cleanCodigo = codigoDocente.trim();

    if (!cleanNombre) {
      setError('El nombre completo es obligatorio.');
      return;
    }
    if (!cleanCodigo) {
      setError('El usuario / código de docente es obligatorio.');
      return;
    }

    // Verify current password
    if (currentPassword.trim() !== currentDocente.contrasena.trim()) {
      setError('Tu contraseña actual es incorrecta.');
      return;
    }

    // If changing password
    let finalPassword = currentDocente.contrasena;
    if (newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        setError('La nueva contraseña debe tener al menos 4 caracteres.');
        return;
      }
      if (newPassword.trim() !== confirmPassword.trim()) {
        setError('La nueva contraseña y su confirmación no coinciden.');
        return;
      }
      finalPassword = newPassword.trim();
    }

    const updated: DocenteUsuario = {
      ...currentDocente,
      nombreCompleto: cleanNombre,
      codigoDocente: cleanCodigo,
      correo: correo.trim() || currentDocente.correo,
      contrasena: finalPassword,
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
        className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#103B88] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 border border-blue-800 flex items-center justify-center text-blue-200">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Mi Perfil y Credenciales</h3>
              <p className="text-xs text-blue-200">Modificar usuario y contraseña de docente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
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
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Usuario / Código Docente *
              </label>
              <input
                type="text"
                required
                value={codigoDocente}
                onChange={(e) => setCodigoDocente(e.target.value)}
                placeholder="6379"
                className="w-full px-3.5 py-2 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
              <span className="text-[10px] text-slate-400">Usuario para ingresar</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@uagrm.edu.bo"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Contraseña Actual (para confirmar cambios) *
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Escribe tu contraseña actual"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Nueva Contraseña (opcional)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-500 hover:text-[#174EAF] flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Ocultar' : 'Ver'}</span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Dejar en blanco si no deseas cambiarla"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>

            {newPassword.trim() && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
                />
              </div>
            )}
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
              className="px-5 py-2 text-xs font-bold text-white bg-[#103B88] hover:bg-[#174EAF] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Mis Credenciales</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
