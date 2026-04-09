import { JSX, useState } from "react";

export interface SpellFormData {
  id: number;
  name: string;
  description: string;
  icon_id: number;
  school: SpellSchool;
}

export type SpellSchool =
  | "Physical"
  | "Holy"
  | "Fire"
  | "Nature"
  | "Frost"
  | "Shadow"
  | "Arcane";

const SPELL_SCHOOLS: { value: SpellSchool; color: string }[] = [
  { value: "Physical", color: "text-gray-300" },
  { value: "Holy", color: "text-yellow-300" },
  { value: "Fire", color: "text-orange-400" },
  { value: "Nature", color: "text-green-400" },
  { value: "Frost", color: "text-sky-300" },
  { value: "Shadow", color: "text-purple-400" },
  { value: "Arcane", color: "text-pink-400" },
];

const DEFAULT_FORM: SpellFormData = {
  id: 900001,
  name: "",
  description: "",
  icon_id: 1,
  school: "Physical",
};

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <label className="text-sm font-semibold text-green-400">{label}</label>
        {hint && <span className="text-xs text-gray-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function CreateSpell(): JSX.Element {
  const [form, setForm] = useState<SpellFormData>(DEFAULT_FORM);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const set = <K extends keyof SpellFormData>(
    key: K,
    value: SpellFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleGenerate = async () => {
    // wire up: await invoke("generate_spell_sql", { spell: form });
    setStatus("success");
    setMessage(`SQL generated for spell ${form.id} — "${form.name}"`);
  };

  const handleReset = () => {
    setForm(DEFAULT_FORM);
    setStatus("idle");
    setMessage("");
  };

  const selectedSchool = SPELL_SCHOOLS.find((s) => s.value === form.school)!;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-green-400">Create Spell</h2>

      <div className="max-w-2xl space-y-6">
        {status === "success" && (
          <div className="bg-green-900 bg-opacity-30 border border-green-700 text-green-400 text-sm px-4 py-3 rounded">
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="bg-red-900 bg-opacity-30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded">
            {message}
          </div>
        )}

        <div className="bg-gray-800 border border-gray-700 rounded p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-3">
            Identity
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Spell ID" hint="must be unique">
              <input
                type="number"
                value={form.id}
                onChange={(e) => set("id", Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-600 hover:border-gray-500 focus:border-green-400 rounded px-3 py-2 text-white text-sm outline-none transition-colors font-mono"
              />
            </Field>

            <Field label="Icon ID" hint="SpellIcon.dbc row">
              <input
                type="number"
                value={form.icon_id}
                onChange={(e) => set("icon_id", Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-600 hover:border-gray-500 focus:border-green-400 rounded px-3 py-2 text-white text-sm outline-none transition-colors font-mono"
              />
            </Field>
          </div>

          <Field label="Name">
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Shadow Nova"
              className="w-full bg-gray-900 border border-gray-600 hover:border-gray-500 focus:border-green-400 rounded px-3 py-2 text-white text-sm outline-none transition-colors placeholder-gray-600"
            />
          </Field>

          <Field label="Description" hint="shown in tooltip">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Deals damage to nearby enemies…"
              rows={3}
              className="w-full bg-gray-900 border border-gray-600 hover:border-gray-500 focus:border-green-400 rounded px-3 py-2 text-white text-sm outline-none transition-colors resize-none placeholder-gray-600"
            />
          </Field>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-3">
            School
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {SPELL_SCHOOLS.map(({ value, color }) => (
              <button
                key={value}
                onClick={() => set("school", value)}
                className={`px-3 py-2 rounded border text-sm font-semibold transition-colors cursor-pointer
                  ${
                    form.school === value
                      ? `bg-gray-700 border-green-400 ${color}`
                      : "bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                  }`}
              >
                {value}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Selected:{" "}
            <span className={`font-semibold ${selectedSchool.color}`}>
              {form.school}
            </span>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={!form.name.trim()}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded transition-colors cursor-pointer"
          >
            Generate SQL
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
