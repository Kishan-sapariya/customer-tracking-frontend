"use client";
import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, XCircle } from "lucide-react";
import { Button, Card, Select } from "./ui";
import { InlineError } from "./InlineError";
import { useActionError } from "@/lib/useActionError";
import { api } from "@/lib/api";
import { parseExcelFile, downloadTemplate } from "@/lib/excel";
import * as XLSX from "xlsx";

interface PreviewRow {
  row: number;
  valid: boolean;
  data?: Record<string, unknown>;
  errors?: { field: string; message: string }[];
}

// Drag-drop bulk upload with preview-before-commit (FR-2.4). Shared by both
// tabs (config: old vs new). Shows valid/invalid rows, lets you commit, then a
// summary with a downloadable error report.
export function ExcelUploader({ kind, onDone }: { kind: "old" | "new"; onDone: () => void }) {
  const { run, error, loading } = useActionError();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; valid: number; invalid: number } | null>(null);
  const [onDuplicate, setOnDuplicate] = useState<"skip" | "update" | "error">("skip");
  const [result, setResult] = useState<any>(null);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setResult(null);
    const rows = await parseExcelFile(file);
    setRawRows(rows);
    await run(
      async () => {
        const res = await api<{ data: { rows: PreviewRow[]; summary: any } }>(`/customers/${kind}/preview`, {
          method: "POST",
          body: { rows },
        });
        setPreview(res.data.rows);
        setSummary(res.data.summary);
      },
      {}
    );
  };

  const commit = () =>
    run(
      async () => {
        const res = await api(`/customers/${kind}/import`, {
          method: "POST",
          body: { rows: rawRows, onDuplicate, blockOnError: false },
        });
        setResult((res as any).data);
        setPreview(null);
        onDone();
      },
      { successMessage: "Import complete" }
    );

  const downloadErrors = () => {
    if (!result?.errors?.length) return;
    const ws = XLSX.utils.json_to_sheet(result.errors);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Errors");
    XLSX.writeFile(wb, `import-errors_${kind}.xlsx`);
  };

  const reset = () => {
    setRawRows([]);
    setPreview(null);
    setSummary(null);
    setResult(null);
    setFileName("");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Upload an <strong>.xlsx</strong> using the template. Rows are validated before anything is saved.
        </p>
        <Button variant="outline" size="sm" onClick={() => downloadTemplate(kind)}>
          <Download className="h-4 w-4" /> Download Template
        </Button>
      </div>

      {/* Drop zone */}
      {!preview && !result && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 transition-colors ${
            dragOver ? "border-primary bg-primary-subtle" : "border-border hover:border-primary/40"
          }`}
        >
          <UploadCloud className="h-8 w-8 text-primary" />
          <p className="text-sm font-medium">Drop your Excel file here, or click to browse</p>
          <p className="text-xs text-muted-foreground">{fileName || ".xlsx / .csv"}</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Validating…</p>}
      <InlineError message={error} />

      {/* Preview */}
      {preview && summary && (
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="font-medium">{fileName}</span>
              <span className="text-emerald-600">{summary.valid} valid</span>
              {summary.invalid > 0 && <span className="text-danger">{summary.invalid} invalid</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">On duplicate:</span>
              <Select value={onDuplicate} onChange={(e) => setOnDuplicate(e.target.value as any)} className="h-8 w-auto text-xs">
                <option value="skip">Skip</option>
                <option value="update">Update</option>
                <option value="error">Error</option>
              </Select>
            </div>
          </div>

          <div className="max-h-72 overflow-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-muted">
                <tr className="text-left text-muted-foreground">
                  <th className="px-2 py-1.5">Row</th>
                  <th className="px-2 py-1.5">Status</th>
                  <th className="px-2 py-1.5">Company</th>
                  <th className="px-2 py-1.5">Issue</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.row} className="border-t border-border">
                    <td className="px-2 py-1.5 font-mono">{r.row}</td>
                    <td className="px-2 py-1.5">
                      {r.valid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Valid</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-danger"><XCircle className="h-3 w-3" /> Invalid</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5">{(r.data?.company as string) ?? "—"}</td>
                    <td className="px-2 py-1.5 text-danger">{r.errors?.map((e) => `${e.field}: ${e.message}`).join("; ") ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Button loading={loading} onClick={commit} disabled={summary.valid === 0}>
              Commit {summary.valid} valid row{summary.valid === 1 ? "" : "s"}
            </Button>
            <Button variant="secondary" onClick={reset}>Cancel</Button>
            {summary.invalid > 0 && (
              <span className="text-xs text-muted-foreground">Invalid rows are skipped on commit.</span>
            )}
          </div>
        </Card>
      )}

      {/* Result summary */}
      {result && (
        <Card className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Import summary</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-emerald-600">✓ {result.added} added</span>
            {result.updated > 0 && <span className="text-primary">↻ {result.updated} updated</span>}
            <span className="text-muted-foreground">⤳ {result.skipped} skipped</span>
            {result.errors?.length > 0 && <span className="text-danger">✗ {result.errors.length} errors</span>}
          </div>
          <div className="flex gap-2">
            {result.errors?.length > 0 && (
              <Button variant="outline" size="sm" onClick={downloadErrors}>
                <Download className="h-4 w-4" /> Download error report
              </Button>
            )}
            <Button size="sm" onClick={reset}>Upload another file</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
