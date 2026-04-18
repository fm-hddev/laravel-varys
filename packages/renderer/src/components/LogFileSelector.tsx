interface Props {
  files: string[];
  selected: string | null;
  onChange: (file: string) => void;
}

function basename(path: string): string {
  return path.split('/').pop() ?? path;
}

export function LogFileSelector({ files, selected, onChange }: Props) {
  return (
    <div>
      <label htmlFor="log-file-select" className="mb-1 block text-xs text-neutral-500">
        Fichier de log
      </label>
      <select
        id="log-file-select"
        value={selected ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        {files.map((f) => (
          <option key={f} value={f}>
            {basename(f)}
          </option>
        ))}
      </select>
    </div>
  );
}
