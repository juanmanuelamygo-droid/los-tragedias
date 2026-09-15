import { useState, useEffect, useMemo } from "react";
import {
  Home, ListOrdered, PlusCircle, Users, LogOut, Pencil, Trash2,
  Lock, ArrowUpCircle, ArrowDownCircle, ShieldCheck, UserPlus
} from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const EXPENSE_CATEGORIES = [
  "Alquiler", "Luz", "Agua", "Mantenimiento", "Limpieza", "Compras", "Otros gastos",
];
const INCOME_CATEGORIES = [
  "Cuota mensual", "Evento", "Alquiler camas", "Otros ingresos",
];

const ROLE_LABEL = { admin: "Administrador", editor: "Editor", viewer: "Lector" };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fmtMoney(n) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

.lt-root {
  --bg: #171B1E;
  --bg-alt: #20262A;
  --ink: #ECE6D8;
  --ink-soft: #93A0A5;
  --brass: #CD9C51;
  --moss: #74B489;
  --rust: #DD7B67;
  --line: #333B40;
  font-family: 'Inter', sans-serif;
  color: var(--ink);
  background: var(--bg);
  max-width: 26rem;
  margin: 0 auto;
  min-height: 34rem;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  overflow: hidden;
}
.lt-serif { font-family: 'Fraunces', serif; }
.lt-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
.lt-header {
  background: #0F1214;
  color: var(--ink);
  padding: 1.1rem 1.25rem 1rem;
  position: relative;
  border-bottom: 1px solid var(--line);
}
.lt-header::after {
  content: "";
  position: absolute;
  left: 0; right: 0; bottom: -1px;
  height: 3px;
  background: repeating-linear-gradient(90deg, var(--brass) 0 10px, transparent 10px 14px);
  opacity: 0.5;
}
.lt-card {
  background: var(--bg-alt);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 0.9rem 1rem;
}
.lt-rule { border-top: 1px solid var(--line); }
.lt-btn {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  border: 1px solid var(--brass);
  background: var(--brass);
  color: #201404;
  padding: 0.6rem 1rem;
  border-radius: 3px;
  cursor: pointer;
  transition: opacity .15s ease;
}
.lt-btn:active { opacity: 0.75; }
.lt-btn-ghost {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--line);
}
.lt-input {
  font-family: 'Inter', sans-serif;
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--line);
  border-radius: 3px;
  background: #121618;
  color: var(--ink);
  font-size: 0.92rem;
}
.lt-input:focus { outline: 2px solid var(--brass); outline-offset: 1px; }
.lt-tag {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  color: var(--ink-soft);
  white-space: nowrap;
}
.lt-navbtn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.68rem;
  color: var(--ink-soft);
  background: none;
  border: none;
  padding: 0.4rem 0.3rem;
  cursor: pointer;
}
.lt-navbtn.active { color: var(--ink); font-weight: 600; }
.lt-navbtn.active svg { color: var(--brass); }
.lt-scroll { overflow-y: auto; flex: 1; }
.lt-type-toggle {
  display: flex;
  border: 1px solid var(--line);
  border-radius: 3px;
  overflow: hidden;
}
.lt-type-toggle button {
  flex: 1;
  padding: 0.55rem 0.4rem;
  font-size: 0.85rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  background: transparent;
  color: var(--ink-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}
.lt-type-toggle button.on-gasto { background: rgba(221,123,103,0.16); color: var(--rust); }
.lt-type-toggle button.on-ingreso { background: rgba(116,180,137,0.16); color: var(--moss); }
`;

export default function LosTragediasApp() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sessionUserId, setSessionUserId] = useState(null);
  const [view, setView] = useState("resumen");
  const [editingTx, setEditingTx] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let membersLoaded = false;
    let txLoaded = false;
    const checkLoaded = () => {
      if (membersLoaded && txLoaded) setLoading(false);
    };

    const unsubMembers = onSnapshot(doc(db, "house", "members"), (snap) => {
      setMembers(snap.exists() ? snap.data().list || [] : []);
      membersLoaded = true;
      checkLoaded();
    });
    const unsubTx = onSnapshot(doc(db, "house", "transactions"), (snap) => {
      setTransactions(snap.exists() ? snap.data().list || [] : []);
      txLoaded = true;
      checkLoaded();
    });

    return () => {
      unsubMembers();
      unsubTx();
    };
  }, []);

  const currentUser = members.find((m) => m.id === sessionUserId) || null;
  const canWrite = currentUser && (currentUser.role === "admin" || currentUser.role === "editor");
  const canManage = currentUser && currentUser.role === "admin";

  async function persistMembers(next) {
    await setDoc(doc(db, "house", "members"), { list: next });
  }
  async function persistTransactions(next) {
    await setDoc(doc(db, "house", "transactions"), { list: next });
  }

  function logout() {
    setSessionUserId(null);
    setView("resumen");
  }

  if (loading) {
    return (
      <div className="lt-root">
        <style>{STYLE}</style>
        <div className="lt-scroll" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "20rem" }}>
          <p className="lt-serif" style={{ color: "var(--ink-soft)" }}>Cargando Los Tragedias…</p>
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="lt-root">
        <style>{STYLE}</style>
        <SetupScreen onCreate={async (name, pin) => {
          const admin = { id: uid(), name, role: "admin", pin };
          await persistMembers([admin]);
        }} />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="lt-root">
        <style>{STYLE}</style>
        <LoginScreen
          members={members}
          error={error}
          onLogin={(id, pin) => {
            const m = members.find((x) => x.id === id);
            if (m && m.pin === pin) {
              setSessionUserId(id);
              setError("");
            } else {
              setError("PIN incorrecto.");
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="lt-root">
      <style>{STYLE}</style>
      <div className="lt-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p className="lt-serif" style={{ fontSize: "1.4rem", fontWeight: 600, margin: 0, letterSpacing: "0.01em" }}>Los Tragedias</p>
            <p style={{ fontSize: "0.75rem", margin: "0.15rem 0 0", color: "var(--ink-soft)" }}>Libro de cuentas de la casa</p>
          </div>
          <button onClick={logout} aria-label="Cerrar sesión" style={{ background: "none", border: "none", color: "var(--ink-soft)", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <LogOut size={16} />
          </button>
        </div>
        <div style={{ marginTop: "0.7rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--brass)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 600, color: "#201404" }}>
            {currentUser.name.slice(0, 1).toUpperCase()}
          </span>
          <span style={{ fontSize: "0.8rem" }}>{currentUser.name}</span>
          <span className="lt-tag">{ROLE_LABEL[currentUser.role]}</span>
        </div>
      </div>

      <div className="lt-scroll" style={{ padding: "1rem 1.1rem 1.25rem" }}>
        {view === "resumen" && (
          <ResumenView transactions={transactions} />
        )}
        {view === "movimientos" && (
          <MovimientosView
            members={members}
            transactions={transactions}
            canWrite={canWrite}
            onEdit={(tx) => { setEditingTx(tx); setView("anadir"); }}
            onDelete={async (id) => {
              await persistTransactions(transactions.filter((t) => t.id !== id));
            }}
          />
        )}
        {view === "anadir" && canWrite && (
          <TransactionForm
            members={members}
            editingTx={editingTx}
            currentUser={currentUser}
            onCancel={() => { setEditingTx(null); setView("movimientos"); }}
            onSave={async (tx) => {
              if (editingTx) {
                await persistTransactions(transactions.map((t) => (t.id === tx.id ? tx : t)));
              } else {
                await persistTransactions([tx, ...transactions]);
              }
              setEditingTx(null);
              setView("movimientos");
            }}
          />
        )}
        {view === "miembros" && canManage && (
          <MiembrosView
            members={members}
            currentUser={currentUser}
            onSave={persistMembers}
          />
        )}
      </div>

      <div className="lt-rule" style={{ display: "flex", justifyContent: "space-around", padding: "0.4rem 0", background: "#0F1214" }}>
        <NavBtn icon={Home} label="Resumen" active={view === "resumen"} onClick={() => setView("resumen")} />
        <NavBtn icon={ListOrdered} label="Apuntes" active={view === "movimientos"} onClick={() => setView("movimientos")} />
        {canWrite && (
          <NavBtn icon={PlusCircle} label="Añadir" active={view === "anadir"} onClick={() => { setEditingTx(null); setView("anadir"); }} />
        )}
        {canManage && (
          <NavBtn icon={Users} label="Casa" active={view === "miembros"} onClick={() => setView("miembros")} />
        )}
      </div>
    </div>
  );
}

function NavBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button className={"lt-navbtn" + (active ? " active" : "")} onClick={onClick}>
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

function SetupScreen({ onCreate }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [err, setErr] = useState("");

  function submit() {
    if (!name.trim()) return setErr("Escribe tu nombre.");
    if (!/^\d{4}$/.test(pin)) return setErr("El PIN debe tener 4 dígitos.");
    if (pin !== pin2) return setErr("Los PIN no coinciden.");
    onCreate(name.trim(), pin);
  }

  return (
    <div className="lt-scroll" style={{ padding: "2rem 1.4rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <p className="lt-serif" style={{ fontSize: "1.7rem", fontWeight: 600, margin: 0 }}>Los Tragedias</p>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", marginTop: "0.3rem" }}>
          Configura la casa. La primera persona que entra queda como administradora y podrá invitar al resto.
        </p>
      </div>
      <div className="lt-card" style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        <label style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>Tu nombre
          <input className="lt-input" style={{ marginTop: "0.3rem" }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Marta" />
        </label>
        <label style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>PIN de acceso (4 dígitos)
          <input className="lt-input" style={{ marginTop: "0.3rem" }} value={pin} maxLength={4} inputMode="numeric" onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
        </label>
        <label style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>Repite el PIN
          <input className="lt-input" style={{ marginTop: "0.3rem" }} value={pin2} maxLength={4} inputMode="numeric" onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
        </label>
        {err && <p style={{ fontSize: "0.78rem", color: "var(--rust)", margin: 0 }}>{err}</p>}
        <button className="lt-btn" onClick={submit}>Crear la casa</button>
      </div>
    </div>
  );
}

function LoginScreen({ members, error, onLogin }) {
  const [selected, setSelected] = useState(members[0]?.id || "");
  const [pin, setPin] = useState("");

  return (
    <div className="lt-scroll" style={{ padding: "2.2rem 1.4rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
      <div style={{ textAlign: "center" }}>
        <p className="lt-serif" style={{ fontSize: "1.9rem", fontWeight: 600, margin: 0, color: "var(--ink)" }}>Los Tragedias</p>
        <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginTop: "0.25rem" }}>Libro de cuentas de la casa compartida</p>
      </div>
      <div className="lt-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <label style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>Quién eres
          <select className="lt-input" style={{ marginTop: "0.3rem" }} value={selected} onChange={(e) => setSelected(e.target.value)}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name} — {ROLE_LABEL[m.role]}</option>)}
          </select>
        </label>
        <label style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>PIN
          <input className="lt-input" style={{ marginTop: "0.3rem" }} value={pin} maxLength={4} inputMode="numeric" onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
        </label>
        {error && <p style={{ fontSize: "0.78rem", color: "var(--rust)", margin: 0 }}>{error}</p>}
        <button className="lt-btn" onClick={() => onLogin(selected, pin)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
          <Lock size={14} /> Entrar
        </button>
      </div>
    </div>
  );
}

function ResumenView({ transactions }) {
  const totals = useMemo(() => {
    let ingresos = 0, gastos = 0;
    transactions.forEach((t) => {
      if (t.type === "ingreso") ingresos += t.amount;
      else gastos += t.amount;
    });
    return { ingresos, gastos, saldo: ingresos - gastos };
  }, [transactions]);

  const byCategory = useMemo(() => {
    const map = {};
    transactions.filter((t) => t.type === "gasto").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const positive = totals.saldo >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
      <div className="lt-card">
        <p style={{ fontSize: "0.72rem", color: "var(--ink-soft)", margin: 0 }}>Saldo actual de la casa</p>
        <p className="lt-mono" style={{ fontSize: "1.9rem", fontWeight: 600, margin: "0.2rem 0 0", color: positive ? "var(--moss)" : "var(--rust)" }}>
          {fmtMoney(totals.saldo)}
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.6rem" }}>
        <div className="lt-card" style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <ArrowUpCircle size={14} color="var(--moss)" />
            <p style={{ fontSize: "0.72rem", color: "var(--ink-soft)", margin: 0 }}>Ingresos</p>
          </div>
          <p className="lt-mono" style={{ fontSize: "1.15rem", fontWeight: 600, margin: "0.3rem 0 0", color: "var(--moss)" }}>{fmtMoney(totals.ingresos)}</p>
        </div>
        <div className="lt-card" style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <ArrowDownCircle size={14} color="var(--rust)" />
            <p style={{ fontSize: "0.72rem", color: "var(--ink-soft)", margin: 0 }}>Gastos</p>
          </div>
          <p className="lt-mono" style={{ fontSize: "1.15rem", fontWeight: 600, margin: "0.3rem 0 0", color: "var(--rust)" }}>{fmtMoney(totals.gastos)}</p>
        </div>
      </div>

      {byCategory.length > 0 && (
        <div>
          <p className="lt-serif" style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 0.5rem" }}>Gastos por categoría</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {byCategory.map(([cat, amt]) => (
              <div key={cat} className="lt-rule" style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0.1rem" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>{cat}</span>
                <span className="lt-mono" style={{ fontSize: "0.85rem" }}>{fmtMoney(amt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MovimientosView({ members, transactions, canWrite, onEdit, onDelete }) {
  const nameOf = (id) => members.find((m) => m.id === id)?.name || "—";
  const sorted = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1));

  if (sorted.length === 0) {
    return (
      <div className="lt-card" style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
        <p className="lt-serif" style={{ fontWeight: 600, margin: 0 }}>Aún no hay apuntes</p>
        <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", marginTop: "0.3rem" }}>
          {canWrite ? "Añade el primer ingreso o gasto desde la pestaña Añadir." : "Cuando alguien registre un movimiento, aparecerá aquí."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
      {sorted.map((t) => {
        const isIncome = t.type === "ingreso";
        return (
          <div key={t.id} className="lt-card" style={{ padding: "0.7rem 0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: "0.55rem" }}>
                {isIncome
                  ? <ArrowUpCircle size={17} color="var(--moss)" style={{ marginTop: "0.1rem", flexShrink: 0 }} />
                  : <ArrowDownCircle size={17} color="var(--rust)" style={{ marginTop: "0.1rem", flexShrink: 0 }} />}
                <div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 500, margin: 0 }}>{t.description}</p>
                  <p style={{ fontSize: "0.72rem", color: "var(--ink-soft)", margin: "0.15rem 0 0" }}>
                    {fmtDate(t.date)}{t.person ? ` · ${nameOf(t.person)}` : ""}
                  </p>
                </div>
              </div>
              <span className="lt-mono" style={{ fontSize: "0.95rem", fontWeight: 600, color: isIncome ? "var(--moss)" : "var(--rust)" }}>
                {isIncome ? "+" : "−"}{fmtMoney(t.amount)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
              <span className="lt-tag">{t.category}</span>
              {canWrite && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button aria-label="Editar" onClick={() => onEdit(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)" }}>
                    <Pencil size={15} />
                  </button>
                  <button aria-label="Eliminar" onClick={() => onDelete(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TransactionForm({ members, editingTx, currentUser, onCancel, onSave }) {
  const [type, setType] = useState(editingTx?.type || "gasto");
  const [description, setDescription] = useState(editingTx?.description || "");
  const [amount, setAmount] = useState(editingTx ? String(editingTx.amount) : "");
  const [date, setDate] = useState(editingTx?.date || new Date().toISOString().slice(0, 10));
  const categories = type === "gasto" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const [category, setCategory] = useState(editingTx?.category || categories[0]);
  const [person, setPerson] = useState(editingTx?.person || currentUser.id);
  const [err, setErr] = useState("");

  function changeType(newType) {
    setType(newType);
    const cats = newType === "gasto" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!cats.includes(category)) setCategory(cats[0]);
  }

  function submit() {
    const amt = parseFloat(amount.replace(",", "."));
    if (!description.trim()) return setErr("Escribe una descripción.");
    if (!amt || amt <= 0) return setErr("Introduce un importe válido.");
    setErr("");
    onSave({
      id: editingTx?.id || uid(),
      type,
      description: description.trim(),
      amount: amt,
      date,
      category,
      person,
      createdBy: editingTx?.createdBy || currentUser.id,
      createdAt: editingTx?.createdAt || new Date().toISOString(),
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
      <p className="lt-serif" style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>
        {editingTx ? "Editar apunte" : "Nuevo apunte"}
      </p>

      <div className="lt-type-toggle">
        <button className={type === "gasto" ? "on-gasto" : ""} onClick={() => changeType("gasto")}>
          <ArrowDownCircle size={15} /> Gasto
        </button>
        <button className={type === "ingreso" ? "on-ingreso" : ""} onClick={() => changeType("ingreso")}>
          <ArrowUpCircle size={15} /> Ingreso
        </button>
      </div>

      <label style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>Descripción
        <input className="lt-input" style={{ marginTop: "0.3rem" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === "gasto" ? "Ej. Factura de la luz - octubre" : "Ej. Aportación mensual de Marta"} />
      </label>

      <div style={{ display: "flex", gap: "0.6rem" }}>
        <label style={{ fontSize: "0.78rem", color: "var(--ink-soft)", flex: 1 }}>Importe (€)
          <input className="lt-input" style={{ marginTop: "0.3rem" }} value={amount} inputMode="decimal" onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
        </label>
        <label style={{ fontSize: "0.78rem", color: "var(--ink-soft)", flex: 1 }}>Fecha
          <input className="lt-input" type="date" style={{ marginTop: "0.3rem" }} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      <label style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>Categoría
        <select className="lt-input" style={{ marginTop: "0.3rem" }} value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>

      <label style={{ fontSize: "0.78rem", color: "var(--ink-soft)" }}>{type === "gasto" ? "Pagado por" : "Ingresado por"}
        <select className="lt-input" style={{ marginTop: "0.3rem" }} value={person} onChange={(e) => setPerson(e.target.value)}>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </label>

      {err && <p style={{ fontSize: "0.78rem", color: "var(--rust)", margin: 0 }}>{err}</p>}

      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.3rem" }}>
        <button className="lt-btn-ghost lt-btn" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
        <button className="lt-btn" style={{ flex: 1 }} onClick={submit}>Guardar apunte</button>
      </div>
    </div>
  );
}

function MiembrosView({ members, currentUser, onSave }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState("editor");
  const [err, setErr] = useState("");

  function addMember() {
    if (!name.trim()) return setErr("Escribe un nombre.");
    if (!/^\d{4}$/.test(pin)) return setErr("El PIN debe tener 4 dígitos.");
    setErr("");
    onSave([...members, { id: uid(), name: name.trim(), role, pin }]);
    setName(""); setPin(""); setRole("editor");
  }

  function changeRole(id, newRole) {
    onSave(members.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
  }

  function removeMember(id) {
    if (id === currentUser.id) return;
    onSave(members.filter((m) => m.id !== id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
      <div>
        <p className="lt-serif" style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.6rem" }}>Personas de la casa</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {members.map((m) => (
            <div key={m.id} className="lt-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55rem 0.75rem" }}>
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 500, margin: 0 }}>{m.name}</p>
                <p style={{ fontSize: "0.7rem", color: "var(--ink-soft)", margin: "0.1rem 0 0" }}>PIN {m.pin}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <select className="lt-input" style={{ width: "auto", padding: "0.3rem 0.4rem", fontSize: "0.75rem" }} value={m.role} onChange={(e) => changeRole(m.id, e.target.value)}>
                  <option value="admin">Administrador</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Lector</option>
                </select>
                {m.id !== currentUser.id && (
                  <button aria-label="Eliminar" onClick={() => removeMember(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)" }}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="lt-serif" style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <UserPlus size={16} /> Invitar a alguien
        </p>
        <div className="lt-card" style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <input className="lt-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input className="lt-input" value={pin} maxLength={4} inputMode="numeric" onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="PIN de 4 dígitos" />
            <select className="lt-input" style={{ flexShrink: 0, width: "auto" }} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="editor">Editor</option>
              <option value="viewer">Lector</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {err && <p style={{ fontSize: "0.78rem", color: "var(--rust)", margin: 0 }}>{err}</p>}
          <button className="lt-btn" onClick={addMember}>Añadir a la casa</button>
        </div>
      </div>

      <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)", display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
        <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
        <span>Administrador: gestiona la casa y los apuntes. Editor: añade y edita apuntes. Lector: solo puede consultar.</span>
      </div>
    </div>
  );
}
