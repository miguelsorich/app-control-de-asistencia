import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, RefreshCw, Copy, Check, ExternalLink, Code } from 'lucide-react';
import { testSupabaseConnection, SUPABASE_SQL_SCHEMA } from '../services/supabaseSync';
import { SUPABASE_CONFIG } from '../lib/supabase';

interface SupabaseSyncBadgeProps {
  onManualSync?: () => void;
  isSyncing?: boolean;
}

export const SupabaseSyncBadge: React.FC<SupabaseSyncBadgeProps> = ({
  onManualSync,
  isSyncing = false,
}) => {
  const [status, setStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [statusMessage, setStatusMessage] = useState<string>('Verificando conexión con Supabase...');
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const checkConnection = async () => {
    setStatus('testing');
    setStatusMessage('Comprobando base de datos Supabase...');
    const res = await testSupabaseConnection();
    if (res.ok) {
      setStatus('connected');
      setStatusMessage(res.message);
    } else {
      setStatus('error');
      setStatusMessage(res.message);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <div className="inline-flex items-center gap-2 bg-[#103B88]/90 text-white px-3 py-1.5 rounded-xl border border-white/20 text-xs shadow-xs">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-emerald-300" />
          <span className="font-semibold hidden sm:inline">Supabase DB:</span>
          <span className="font-mono text-[11px] text-white/90 truncate max-w-[100px] sm:max-w-none">
            {SUPABASE_CONFIG.projectId}
          </span>
        </div>

        <div className="h-3 w-px bg-white/20" />

        {status === 'testing' || isSyncing ? (
          <div className="flex items-center gap-1 text-amber-200">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span className="text-[11px] hidden md:inline">Sincronizando</span>
          </div>
        ) : status === 'connected' ? (
          <div className="flex items-center gap-1 text-emerald-300">
            <CheckCircle className="w-3 h-3" />
            <span className="text-[11px] hidden md:inline">Activa</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-amber-300" title={statusMessage}>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[11px] hidden md:inline">Local + Cloud</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowSqlModal(true)}
          className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          title="Ver script SQL / Esquema de tablas Supabase"
        >
          <Code className="w-3.5 h-3.5" />
        </button>

        {onManualSync && (
          <button
            type="button"
            onClick={onManualSync}
            disabled={isSyncing}
            className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Forzar sincronización con Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* SQL Schema Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172033]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col text-left">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F0FC] text-[#174EAF]">
                  <Database className="w-3.5 h-3.5" />
                  <span>Integración Supabase PostgreSQL</span>
                </div>
                <h3 className="text-lg font-bold text-[#172033]">
                  Esquema de Tablas (SQL)
                </h3>
                <p className="text-xs text-[#667085]">
                  Proyecto: <code className="bg-[#F5F7FA] px-1.5 py-0.5 rounded font-mono text-[#174EAF]">{SUPABASE_CONFIG.projectId}</code>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="text-[#667085] hover:text-[#172033] p-1 rounded-lg hover:bg-[#F5F7FA] transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#E8F0FC]/60 border border-[#DCE3EC] rounded-xl text-xs text-[#172033] space-y-1">
              <p className="font-semibold text-[#174EAF]">
                ✓ Conexión configurada con el proyecto Supabase:
              </p>
              <p className="font-mono text-[11px] text-[#667085] break-all">
                {SUPABASE_CONFIG.url}
              </p>
              <p className="text-[#667085] pt-1">
                Para inicializar o verificar las tablas en tu base de datos de Supabase, puedes copiar el siguiente script y ejecutarlo en el <strong>SQL Editor</strong> de Supabase:
              </p>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-xl border border-[#DCE3EC] bg-[#172033]">
              <pre className="p-4 text-xs font-mono text-emerald-300 overflow-y-auto max-h-64 sm:max-h-72 leading-relaxed">
                {SUPABASE_SQL_SCHEMA.trim()}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#174EAF] hover:bg-[#103B88] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>¡Copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Script SQL</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-[#F5F7FA] hover:bg-[#E8F0FC] text-[#172033] text-xs font-bold rounded-xl border border-[#DCE3EC] transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
