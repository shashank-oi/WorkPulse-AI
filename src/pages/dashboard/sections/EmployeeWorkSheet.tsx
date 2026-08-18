import { Download, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function EmployeeWorkSheet() {
  const { user } = useAuth();

  const storageKey = `workpulse-work-sheet-${
    user?.email ?? "employee"
  }`;

  const [content, setContent] = useState("");

  // Load saved sheet
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);

    if (saved !== null) {
      setContent(saved);
    }
  }, [storageKey]);

  // Automatically save sheet
  useEffect(() => {
    localStorage.setItem(storageKey, content);
  }, [content, storageKey]);

  // Download as Excel
  const downloadExcel = () => {
    const lines = content.split("\n");

    const worksheet = XLSX.utils.aoa_to_sheet(
      lines.map((line) => [line]),
    );

    worksheet["!cols"] = [
      {
        wch: 100,
      },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "My Work",
    );

    const employeeName =
      user?.name?.trim() || "Employee";

    XLSX.writeFile(
      workbook,
      `WorkPulse-${employeeName}-Work-Sheet.xlsx`,
    );
  };

  // Clear sheet
  const clearSheet = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear your entire work sheet?",
    );

    if (!confirmed) {
      return;
    }

    setContent("");
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Employee workspace
          </p>

          <h1 className="text-3xl font-black tracking-tight">
            My Work Sheet
          </h1>

          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Write anything you want here.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={clearSheet}
          >
            <Trash2 className="mr-2 size-4" />
            Clear
          </Button>

          <Button
            type="button"
            onClick={downloadExcel}
          >
            <Download className="mr-2 size-4" />
            Download Excel
          </Button>
        </div>
      </div>

      {/* Blank Work Sheet */}
      <div className="border-2 border-foreground bg-card shadow-brutal-sm">
        <textarea
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
          placeholder="Start writing here..."
          spellCheck={true}
          className="min-h-[600px] w-full resize-y border-0 bg-background p-6 text-base leading-7 outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Save information */}
      <div className="border-2 border-foreground bg-secondary px-4 py-3 text-sm font-bold">
        Your work sheet is automatically saved in
        this browser.
      </div>
    </section>
  );
}