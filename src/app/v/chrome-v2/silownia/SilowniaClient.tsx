"use client";

import { useState } from "react";
import { Trash2, Plus, ArrowLeft, Copy } from "lucide-react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { ChromeV2PassphraseGate } from "@/components/v/chrome-v2/PassphraseGate";
import { ChromeV2Hero } from "@/components/v/chrome-v2/Hero";
import { encrypt, decrypt } from "@/lib/crypto/aes";
import { getLogicalDateString } from "@/lib/date/day-boundary";
import { saveEntry, fetchQuickTickEntry, type QuickTickFlags } from "@/lib/supabase/entries";
import {
  createSession,
  updateSession,
  deleteSession,
  type SessionType,
  type TrainingSessionData,
  type TrainingSessionRow,
  type SessionExercise,
  type ExerciseSet,
} from "@/lib/supabase/training";
import {
  EXERCISES,
  exercisesByGroup,
  findExerciseById,
  type ExerciseGroup,
} from "@/lib/exercises/library";

function makeId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 9);
}

// Logical day boundary 3:00 AM — sesja silowni o 02:30 = wczoraj (per guardrail #5).
function todayDateStr(): string {
  return getLogicalDateString(new Date());
}

function formatDateLabel(iso: string): string {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const TYPE_LABEL: Record<SessionType, string> = {
  push: "Dzień A",
  pull: "Dzień B",
  legs: "Dzień C",
  custom: "Inny",
};

const EMPTY_DATA: TrainingSessionData = { exercises: [] };

interface Props {
  sessions: TrainingSessionRow[];
  lastPush: TrainingSessionRow | null;
  lastPull: TrainingSessionRow | null;
  lastLegs: TrainingSessionRow | null;
}

function SilowniaContent({ sessions, lastPush, lastPull, lastLegs }: Props) {
  const { key } = useCryptoKey();
  const [view, setView] = useState<"list" | "edit">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [data, setData] = useState<TrainingSessionData>(EMPTY_DATA);
  const [date, setDate] = useState<string>(todayDateStr());
  const [type, setType] = useState<SessionType>("push");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [allSessions, setAllSessions] = useState<TrainingSessionRow[]>(sessions);

  if (!key) return null;

  const decryptSession = (row: TrainingSessionRow): TrainingSessionData | null => {
    try {
      return JSON.parse(decrypt(row.ciphertext, key)) as TrainingSessionData;
    } catch {
      return null;
    }
  };

  const decryptCount = (row: TrainingSessionRow): number => {
    const d = decryptSession(row);
    return d?.exercises?.length ?? 0;
  };

  const startNew = () => {
    setEditId(null);
    setData(EMPTY_DATA);
    setDate(todayDateStr());
    setType("push");
    setError("");
    setView("edit");
  };

  const startEdit = (row: TrainingSessionRow) => {
    const d = decryptSession(row);
    if (!d) {
      setError("Nie udalo sie odszyfrowac sesji.");
      return;
    }
    setEditId(row.id);
    setData(d);
    setDate(row.session_date);
    setType(row.session_type);
    setError("");
    setView("edit");
  };

  const backToList = () => {
    setView("list");
    setEditId(null);
    setError("");
  };

  const autoPrefillGymQuickTick = async (sessionDate: string) => {
    try {
      const existing = await fetchQuickTickEntry(sessionDate);
      let flags: QuickTickFlags = {};
      if (existing) {
        try {
          flags = JSON.parse(decrypt(existing.ciphertext, key)) as QuickTickFlags;
        } catch {
          flags = {};
        }
      }
      if (flags.gym) return; // juz oznaczone — nic nie rob
      const next: QuickTickFlags = { ...flags, gym: true };
      const ciphertext = encrypt(JSON.stringify(next), key);
      await saveEntry("quick_tick", sessionDate, null, ciphertext);
    } catch {
      // silently ignore — best-effort prefill
    }
  };

  const persist = async () => {
    setSaving(true);
    setError("");
    try {
      const ciphertext = encrypt(JSON.stringify(data), key);
      if (editId) {
        const result = await updateSession(editId, ciphertext, type, date);
        if (result.error) throw new Error(result.error);
        setAllSessions((prev) =>
          prev.map((s) =>
            s.id === editId
              ? { ...s, session_date: date, session_type: type, ciphertext }
              : s,
          ),
        );
      } else {
        const result = await createSession(date, type, ciphertext);
        if (result.error) throw new Error(result.error);
        if (result.id) {
          setEditId(result.id);
          const newRow: TrainingSessionRow = {
            id: result.id,
            session_date: date,
            session_type: type,
            ciphertext,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setAllSessions((prev) => [newRow, ...prev]);
        }
      }
      // Auto-prefill quick-tick gym dla daty sesji
      await autoPrefillGymQuickTick(date);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Blad zapisu.");
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (id: string) => {
    if (!confirm("Usunac sesje treningowa?")) return;
    setSaving(true);
    setError("");
    try {
      const result = await deleteSession(id);
      if (result.error) throw new Error(result.error);
      setAllSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Blad usuwania.");
    } finally {
      setSaving(false);
    }
  };

  const copyFromLast = (sourceType: SessionType) => {
    const source =
      sourceType === "push" ? lastPush :
      sourceType === "pull" ? lastPull :
      sourceType === "legs" ? lastLegs : null;
    if (!source) return;
    const decoded = decryptSession(source);
    if (!decoded) {
      setError("Nie udalo sie odszyfrowac poprzedniej sesji.");
      return;
    }
    // Kopiuj exercises z planem, ZERUJ wykonanie (sets = [])
    const copied: SessionExercise[] = decoded.exercises.map((ex) => ({
      id: makeId(),
      exerciseId: ex.exerciseId,
      name: ex.name,
      plannedSets: ex.plannedSets,
      plannedReps: ex.plannedReps,
      sets: [],
      notes: ex.notes,
    }));
    setData({ ...data, exercises: copied });
  };

  const addExercise = (exerciseId: string) => {
    let name = exerciseId;
    const lib = findExerciseById(exerciseId);
    if (lib) name = lib.name;
    const ex: SessionExercise = {
      id: makeId(),
      exerciseId,
      name,
      plannedSets: 3,
      plannedReps: 8,
      sets: [],
    };
    setData({ ...data, exercises: [...data.exercises, ex] });
  };

  const removeExercise = (id: string) => {
    setData({ ...data, exercises: data.exercises.filter((e) => e.id !== id) });
  };

  const updateExercise = (id: string, patch: Partial<SessionExercise>) => {
    setData({
      ...data,
      exercises: data.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

  const addSet = (exId: string) => {
    setData({
      ...data,
      exercises: data.exercises.map((e) =>
        e.id === exId
          ? {
              ...e,
              sets: [...e.sets, { reps: 0, weight: 0 }],
            }
          : e,
      ),
    });
  };

  const updateSet = (exId: string, idx: number, patch: Partial<ExerciseSet>) => {
    setData({
      ...data,
      exercises: data.exercises.map((e) =>
        e.id === exId
          ? {
              ...e,
              sets: e.sets.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
            }
          : e,
      ),
    });
  };

  const removeSet = (exId: string, idx: number) => {
    setData({
      ...data,
      exercises: data.exercises.map((e) =>
        e.id === exId ? { ...e, sets: e.sets.filter((_, i) => i !== idx) } : e,
      ),
    });
  };

  // === LIST VIEW ===
  if (view === "list") {
    return (
      <div className="cv2-form-screen">
        <ChromeV2Hero
          eyebrow="Trening"
          title="Siłownia"
          subtitle="DUP A/B/C (3 dni rotacji). Planuj ćwiczenia + serie, w trakcie wpisuj wykonanie."
        >
          <div style={{ marginTop: 16 }}>
            <button type="button" className="btn-edit" onClick={startNew}>
              <Plus size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
              Nowa sesja
            </button>
          </div>
        </ChromeV2Hero>

        {error && <p className="login-error" style={{ marginTop: 12 }}>{error}</p>}

        {allSessions.length === 0 && (
          <div className="ci-banner" style={{ marginTop: 24 }}>
            Brak sesji. Klik &quot;Nowa sesja&quot; zeby zaczac.
          </div>
        )}

        <ul className="silownia-list">
          {allSessions.map((s) => (
            <li key={s.id} className="silownia-row">
              <div className="silownia-row-meta">
                <span className="silownia-row-date">{formatDateLabel(s.session_date)}</span>
                <span className={`silownia-row-type silownia-row-type-${s.session_type}`}>
                  {TYPE_LABEL[s.session_type]}
                </span>
                <span className="silownia-row-count">
                  {decryptCount(s)} cwiczen
                </span>
              </div>
              <div className="silownia-row-actions">
                <button type="button" className="btn-edit" onClick={() => startEdit(s)}>
                  Edytuj
                </button>
                <button
                  type="button"
                  className="dzien-task-remove"
                  onClick={() => removeRow(s.id)}
                  aria-label="Usun sesje"
                  disabled={saving}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // === EDIT VIEW ===
  const lastForType =
    type === "push" ? lastPush :
    type === "pull" ? lastPull :
    type === "legs" ? lastLegs : null;
  const canCopy = lastForType !== null && data.exercises.length === 0;

  return (
    <div className="cv2-form-screen">
      <ChromeV2Hero
        eyebrow="Trening"
        title={editId ? "Edycja sesji" : "Nowa sesja"}
      >
        <div style={{ marginTop: 16 }}>
          <button type="button" className="btn-edit" onClick={backToList}>
            <ArrowLeft size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
            Wróć do listy
          </button>
        </div>
      </ChromeV2Hero>

      <div className="silownia-meta-row">
        <div>
          <label className="ci-field-label" htmlFor="silownia-date">Data</label>
          <input
            id="silownia-date"
            type="date"
            className="ci-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="ci-field-label" htmlFor="silownia-type">Typ sesji</label>
          <select
            id="silownia-type"
            className="ci-input"
            value={type}
            onChange={(e) => setType(e.target.value as SessionType)}
          >
            <option value="push">Dzień A (klatka/barki/triceps)</option>
            <option value="pull">Dzień B (plecy/biceps)</option>
            <option value="legs">Dzień C (nogi)</option>
            <option value="custom">Inny (mieszane)</option>
          </select>
        </div>
      </div>

      {canCopy && (
        <div className="silownia-copy-banner">
          <span>
            Ostatnia sesja {TYPE_LABEL[type]}: {formatDateLabel(lastForType.session_date)}.
            Mozesz skopiowac plan cwiczen (sety x reps), zerujac wykonanie.
          </span>
          <button
            type="button"
            className="btn-edit"
            onClick={() => copyFromLast(type)}
          >
            <Copy size={13} style={{ marginRight: 6, verticalAlign: "-2px" }} />
            Kopiuj plan z poprzedniej {TYPE_LABEL[type]}
          </button>
        </div>
      )}

      <div className="silownia-exercises">
        {data.exercises.map((ex) => (
          <div key={ex.id} className="silownia-exercise">
            <div className="silownia-exercise-header">
              <select
                className="ci-input silownia-exercise-select"
                value={ex.exerciseId}
                onChange={(e) => {
                  const lib = findExerciseById(e.target.value);
                  updateExercise(ex.id, {
                    exerciseId: e.target.value,
                    name: lib ? lib.name : ex.name,
                  });
                }}
              >
                <ExerciseOptions />
                {!findExerciseById(ex.exerciseId) && (
                  <option value={ex.exerciseId}>{ex.name} (custom)</option>
                )}
              </select>
              <button
                type="button"
                className="dzien-task-remove"
                onClick={() => removeExercise(ex.id)}
                aria-label="Usun cwiczenie"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="silownia-plan-row">
              <span className="silownia-plan-label">Plan:</span>
              <input
                type="number"
                min={1}
                max={20}
                className="silownia-plan-num"
                value={ex.plannedSets}
                onChange={(e) =>
                  updateExercise(ex.id, { plannedSets: Math.max(1, parseInt(e.target.value) || 1) })
                }
                aria-label="Liczba serii planowanych"
              />
              <span className="silownia-plan-x">×</span>
              <input
                type="number"
                min={1}
                max={50}
                className="silownia-plan-num"
                value={ex.plannedReps}
                onChange={(e) =>
                  updateExercise(ex.id, { plannedReps: Math.max(1, parseInt(e.target.value) || 1) })
                }
                aria-label="Liczba powtorzen planowanych"
              />
              <span className="silownia-plan-label">reps</span>
            </div>

            <ul className="silownia-sets">
              {ex.sets.map((s, i) => (
                <li key={i} className="silownia-set-row">
                  <span className="silownia-set-num">#{i + 1}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="silownia-set-input"
                    value={s.reps}
                    onChange={(e) => updateSet(ex.id, i, { reps: parseInt(e.target.value) || 0 })}
                    aria-label="Reps"
                    placeholder="reps"
                  />
                  <span className="silownia-set-x">×</span>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    step="0.5"
                    className="silownia-set-input"
                    value={s.weight}
                    onChange={(e) => updateSet(ex.id, i, { weight: parseFloat(e.target.value) || 0 })}
                    aria-label="Waga (kg)"
                    placeholder="kg"
                  />
                  <span className="silownia-set-unit">kg</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step="0.5"
                    className="silownia-set-input silownia-set-rpe"
                    value={s.rpe ?? ""}
                    onChange={(e) =>
                      updateSet(ex.id, i, {
                        rpe: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    aria-label="RPE"
                    placeholder="RPE"
                  />
                  <button
                    type="button"
                    className="dzien-task-remove"
                    onClick={() => removeSet(ex.id, i)}
                    aria-label="Usun serie"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="silownia-add-set"
                  onClick={() => addSet(ex.id)}
                >
                  + Dodaj serie
                </button>
              </li>
            </ul>

            <textarea
              className="ci-textarea ci-textarea-sm"
              placeholder="Notatka do cwiczenia (opcjonalna)"
              value={ex.notes ?? ""}
              onChange={(e) => updateExercise(ex.id, { notes: e.target.value })}
              style={{ marginTop: 12 }}
            />
          </div>
        ))}
      </div>

      <ExerciseAdder onAdd={addExercise} group={type === "custom" ? null : (type as ExerciseGroup)} />

      {error && <p className="login-error" style={{ marginTop: 16 }}>{error}</p>}

      <div className="ci-actions" style={{ marginTop: 24 }}>
        <button
          type="button"
          className="btn-edit"
          onClick={persist}
          disabled={saving || data.exercises.length === 0}
        >
          {saving ? "Zapisuje..." : editId ? "Zapisz zmiany" : "Zapisz sesje"}
        </button>
      </div>
    </div>
  );
}

function ExerciseOptions() {
  const groups: { label: string; group: ExerciseGroup }[] = [
    { label: "Dzień A (push)", group: "push" },
    { label: "Dzień B (pull)", group: "pull" },
    { label: "Dzień C (legs)", group: "legs" },
    { label: "Core", group: "core" },
    { label: "Cardio", group: "cardio" },
  ];
  return (
    <>
      {groups.map(({ label, group }) => (
        <optgroup key={group} label={label}>
          {exercisesByGroup(group).map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

function ExerciseAdder({
  onAdd,
  group,
}: {
  onAdd: (id: string) => void;
  group: ExerciseGroup | null;
}) {
  const [pick, setPick] = useState<string>("");
  const [custom, setCustom] = useState<string>("");

  const visible = group ? exercisesByGroup(group) : EXERCISES;

  return (
    <div className="silownia-add-exercise">
      <h3 className="cv2-form-section-title">+ Dodaj cwiczenie</h3>
      <div className="silownia-add-row">
        <select
          className="ci-input"
          value={pick}
          onChange={(e) => setPick(e.target.value)}
        >
          <option value="">— Wybierz z biblioteki ({group ?? "wszystko"}) —</option>
          {visible.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name} ({ex.primary})
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-edit"
          disabled={!pick}
          onClick={() => {
            if (pick) {
              onAdd(pick);
              setPick("");
            }
          }}
        >
          Dodaj
        </button>
      </div>
      <div className="silownia-add-row" style={{ marginTop: 8 }}>
        <input
          type="text"
          className="ci-input ci-input-wide"
          placeholder="...albo wpisz nazwe custom"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <button
          type="button"
          className="btn-edit"
          disabled={!custom.trim()}
          onClick={() => {
            const name = custom.trim();
            if (!name) return;
            const id = `custom-${crypto.randomUUID().replace(/-/g, "").slice(0, 9)}-${name.toLowerCase().replace(/\s+/g, "-")}`;
            onAdd(id);
            setCustom("");
          }}
        >
          Dodaj custom
        </button>
      </div>
    </div>
  );
}

export function ChromeV2SilowniaClient(props: Props) {
  return (
    <ChromeV2PassphraseGate>
      <SilowniaContent {...props} />
    </ChromeV2PassphraseGate>
  );
}
