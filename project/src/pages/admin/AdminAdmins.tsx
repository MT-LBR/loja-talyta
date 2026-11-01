import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldOff, KeyRound, Plus, Search, Loader2, X, Mail, Calendar, Clock } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
};

type AllUser = {
  id: string;
  email: string;
  created_at: string;
  is_admin: boolean;
};

export function AdminAdmins() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  const { data: admins, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-list'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_admins');
      if (error) throw error;
      return data;
    },
  });

  const { data: allUsers } = useQuery<AllUser[]>({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_all_users');
      if (error) throw error;
      return data;
    },
    enabled: showPromoteModal,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-list'] });
    queryClient.invalidateQueries({ queryKey: ['all-users'] });
  };

  const handleAddAdmin = async () => {
    setError('');
    if (!newEmail.trim() || !newPassword.trim()) {
      setError('Preencha e-mail e senha.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setBusy(true);
    const { error: rpcError } = await supabase.rpc('add_admin', {
      p_email: newEmail.trim(),
      p_password: newPassword,
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setShowAddModal(false);
    setNewEmail('');
    setNewPassword('');
    refresh();
  };

  const handlePromote = async (userId: string) => {
    const target = allUsers?.find((u) => u.id === userId);
    if (!target) return;
    setBusy(true);
    setError('');
    const { error: rpcError } = await supabase.rpc('add_admin', {
      p_email: target.email,
      p_password: 'temporary-promote-123',
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    refresh();
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Remover permissão de administrador desta conta?')) return;
    setError('');
    const { error: rpcError } = await supabase.rpc('remove_admin', { p_user_id: userId });
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    refresh();
  };

  const handleResetPassword = async (newPass: string) => {
    if (!resetTarget) return;
    if (newPass.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setBusy(true);
    setError('');
    const { error: rpcError } = await supabase.rpc('reset_admin_password', {
      p_user_id: resetTarget.id,
      p_new_password: newPass,
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setResetTarget(null);
    setError('');
  };

  const filteredUsers = (allUsers ?? []).filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl">Administradores</h1>
          <p className="mt-1 text-sm text-stone">Gerencie contas com acesso ao painel.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPromoteModal(true)}
            className="flex items-center gap-2 border border-ink px-4 py-2 text-sm text-ink transition-colors hover:bg-ink hover:text-pearl"
          >
            <Shield className="h-4 w-4" />
            Promover existente
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-ink px-4 py-2 text-sm text-pearl transition-colors hover:bg-ink/90"
          >
            <Plus className="h-4 w-4" />
            Novo administrador
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 border border-error bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Admin list */}
      <div className="mt-6 overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-stone" />
          </div>
        ) : admins && admins.length > 0 ? (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-border text-left text-xs uppercase tracking-wider text-stone">
                <th className="px-4 py-3">E-mail</th>
                <th className="hidden px-4 py-3 md:table-cell">Cadastro</th>
                <th className="hidden px-4 py-3 lg:table-cell">Último acesso</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-stone-border transition-colors hover:bg-stone-light/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 flex-shrink-0 text-success" />
                      <span className="font-medium">{a.email}</span>
                      {a.id === user?.id && (
                        <span className="ml-1 rounded-sm bg-ink px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-pearl">
                          Você
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-stone md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {formatDate(a.created_at)}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-stone lg:table-cell">
                    {a.last_sign_in_at ? (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(a.last_sign_in_at)}
                      </div>
                    ) : (
                      <span className="text-stone/60">Nunca</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setResetTarget(a)}
                        title="Alterar senha"
                        className="p-1.5 text-stone transition-colors hover:text-ink"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemove(a.id)}
                        disabled={a.id === user?.id}
                        title={a.id === user?.id ? 'Você não pode remover a si mesmo' : 'Remover admin'}
                        className="p-1.5 text-stone transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ShieldOff className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="border border-stone-border p-12 text-center text-sm text-stone">
            Nenhum administrador encontrado.
          </div>
        )}
      </div>

      {/* Add admin modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md border border-stone-border bg-pearl-pure p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg">Novo administrador</h2>
              <button onClick={() => setShowAddModal(false)} className="text-stone hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-stone">E-mail</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="input-field py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-stone">Senha (mín. 6 caracteres)</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••"
                  className="input-field py-2"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-stone hover:text-ink">
                Cancelar
              </button>
              <button
                onClick={handleAddAdmin}
                disabled={busy}
                className="flex items-center gap-2 bg-ink px-4 py-2 text-sm text-pearl hover:bg-ink/90 disabled:opacity-50"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Criar administrador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote existing user modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={() => { setShowPromoteModal(false); setError(''); }}>
          <div className="w-full max-w-lg border border-stone-border bg-pearl-pure p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg">Promover usuário existente</h2>
              <button onClick={() => { setShowPromoteModal(false); setError(''); }} className="text-stone hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por e-mail..."
                className="input-field pl-10 py-2"
              />
            </div>
            <div className="mt-4 max-h-64 space-y-1 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between border border-stone-border px-3 py-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-stone" />
                      <span>{u.email}</span>
                      {u.is_admin && (
                        <span className="rounded-sm bg-success/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-success">
                          Admin
                        </span>
                      )}
                    </div>
                    {!u.is_admin ? (
                      <button
                        onClick={() => handlePromote(u.id)}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-ink transition-colors hover:bg-ink hover:text-pearl disabled:opacity-50"
                      >
                        <Shield className="h-3 w-3" />
                        Promover
                      </button>
                    ) : (
                      <span className="text-xs text-success">Já é admin</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-stone">Nenhum usuário encontrado.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <ResetPasswordModal
          email={resetTarget.email}
          busy={busy}
          error={error}
          onClose={() => { setResetTarget(null); setError(''); }}
          onConfirm={handleResetPassword}
        />
      )}
    </div>
  );
}

function ResetPasswordModal({
  email,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  email: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (password: string) => void;
}) {
  const [password, setPassword] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={onClose}>
      <div className="w-full max-w-md border border-stone-border bg-pearl-pure p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg">Alterar senha</h2>
          <button onClick={onClose} className="text-stone hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-stone">
          Defina uma nova senha para <span className="font-medium text-ink">{email}</span>.
        </p>
        {error && <p className="mt-2 text-sm text-error">{error}</p>}
        <div className="mt-4">
          <label className="mb-1 block text-xs uppercase tracking-wider text-stone">Nova senha (mín. 6 caracteres)</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            className="input-field py-2"
            autoFocus
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-stone hover:text-ink">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(password)}
            disabled={busy}
            className="flex items-center gap-2 bg-ink px-4 py-2 text-sm text-pearl hover:bg-ink/90 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Salvar senha
          </button>
        </div>
      </div>
    </div>
  );
}
