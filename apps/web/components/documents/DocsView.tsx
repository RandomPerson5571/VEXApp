"use client";

import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useState } from "react";
import type { DesignNotebookEntry } from "@/lib/types/team";

const ACTIVE_DOC_ID = "week2";

const NOTEBOOK_DOCS = [
  { id: "notebook-intro", title: "Notebook Objectives" },
  { id: "notebook-standards", title: "Engineering Standards" },
];

const SEASON_DOCS = [
  { id: "week1", title: "Week 1: Chassis Design" },
  { id: "week2", title: "Week 2: Intake Redesign" },
  { id: "week3", title: "Week 3: Lift Mechanism" },
  { id: "week4", title: "Week 4: Prototypes" },
  { id: "week5", title: "Week 5: Lift Design" },
  { id: "week6", title: "Week 6: Programming" },
];

const TABLE_OF_CONTENTS = [
  { id: "introduction", label: "Introduction" },
  { id: "constraints", label: "Design Constraints" },
  { id: "sketches", label: "Concept Sketches" },
  { id: "prototypes", label: "Prototypes" },
  { id: "results", label: "Testing Results" },
  { id: "conclusion", label: "Conclusion" },
  { id: "steps", label: "Next Steps" },
] as const;

export interface DocsViewProps {
  notebookEntry: DesignNotebookEntry;
}

export function DocsView({ notebookEntry }: DocsViewProps) {
  const [designNotebookOpen, setDesignNotebookOpen] = useState(true);
  const [buildLogsOpen, setBuildLogsOpen] = useState(true);
  const [seasonOpen, setSeasonOpen] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState(ACTIVE_DOC_ID);
  const [activeTocSegment, setActiveTocSegment] = useState("introduction");

  const isActiveDoc = selectedDocId === ACTIVE_DOC_ID;

  const scrollToSection = (sectionId: string) => {
    setActiveTocSegment(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-[#03070e] font-sans">
      <aside className="w-[250px] bg-white dark:bg-[#070b13] border-r border-slate-200 dark:border-slate-900 flex flex-col h-full select-none p-5">
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest block mb-4 border-b border-slate-200 dark:border-slate-900 pb-2">
          Directory
        </span>

        <div className="space-y-3.5 flex-1 overflow-y-auto dashboard-scroll">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setDesignNotebookOpen((open) => !open)}
              className="w-full flex items-center justify-between text-left text-xs font-black text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span className="truncate">Design Notebook</span>
              </div>
              {designNotebookOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
              )}
            </button>

            {designNotebookOpen && (
              <div className="pl-4.5 border-l border-slate-900 space-y-1 py-1">
                {NOTEBOOK_DOCS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedDocId(item.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-semibold text-left cursor-pointer ${
                      selectedDocId === item.id
                        ? "bg-orange-600/10 text-orange-400 font-bold"
                        : "text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-600 dark:text-slate-500" />
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setBuildLogsOpen((open) => !open)}
              className="w-full flex items-center justify-between text-left text-xs font-black text-slate-300 hover:text-slate-100 py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span className="truncate">Build Logs</span>
              </div>
              {buildLogsOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
              )}
            </button>

            {buildLogsOpen && (
              <div className="pl-3.5 border-l border-slate-900 space-y-2 py-1">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSeasonOpen((open) => !open)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-slate-200 py-0.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      {seasonOpen ? (
                        <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <Folder className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      <span>Season 2024-2025</span>
                    </div>
                    {seasonOpen ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>

                  {seasonOpen && (
                    <div className="pl-4 space-y-0.5 py-0.5 border-l border-slate-200 dark:border-slate-900">
                      {SEASON_DOCS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedDocId(item.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-semibold text-left cursor-pointer ${
                            selectedDocId === item.id
                              ? "bg-orange-600/10 text-orange-400 font-bold border-l-2 border-orange-500"
                              : "text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                          }`}
                        >
                          <FileText className="h-3.5 w-3.5 text-slate-600 dark:text-slate-600" />
                          <span className="truncate">{item.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold py-1 cursor-not-allowed">
                  <Folder className="h-3.5 w-3.5 text-slate-700" />
                  <span>Season 2023-2024</span>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-900 my-2" />

          <button
            type="button"
            className="w-full flex items-center gap-2 text-left text-xs font-black text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 py-1.5 cursor-pointer"
          >
            <Folder className="h-4 w-4 text-slate-600 dark:text-slate-500" />
            <span>Rules and Regulations</span>
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-2 text-left text-xs font-black text-slate-400 hover:text-slate-200 py-1.5 cursor-pointer"
          >
            <FileText className="h-4 w-4 text-slate-600" />
            <span>Meeting Notes</span>
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-2 text-left text-xs font-black text-slate-400 hover:text-slate-200 py-1.5 cursor-pointer"
          >
            <FileText className="h-4 w-4 text-slate-600" />
            <span>Safety Manual</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto px-10 py-8 bg-slate-50 dark:bg-[#03070e] text-slate-900 dark:text-slate-300 dashboard-scroll">
        <div className="text-[11px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2 font-mono">
          <span>Documentation</span>
          <ChevronRight className="h-3 w-3" />
          <span>Build Logs</span>
          <ChevronRight className="h-3 w-3" />
          <span>Season 2024-2025</span>
          <ChevronRight className="h-3 w-3 text-orange-500" />
          <span className="text-orange-500">Week 2: Intake Redesign</span>
        </div>

        {!isActiveDoc ? (
          <div className="border border-slate-200 dark:border-slate-900 bg-white dark:bg-[#090e18]/45 p-12 rounded-2xl text-center max-w-2xl mx-auto my-12 shadow-xl select-none">
            <FileText className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-900 dark:text-slate-300">Document is currently archived offline.</p>
            <p className="text-xs text-slate-600 dark:text-slate-600 mt-1">
              Select{" "}
              <span className="text-orange-400 font-bold font-mono">&quot;Week 2: Intake Redesign&quot;</span> from
              the left directory tree to inspect the active notebook entry, review design specs, and inspect
              mechanical blueprints.
            </p>
            <button
              type="button"
              onClick={() => setSelectedDocId(ACTIVE_DOC_ID)}
              className="mt-5 px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-lg shadow-orange-500/10 cursor-pointer"
            >
              Browse Week 2 log
            </button>
          </div>
        ) : (
          <article className="max-w-3xl space-y-8">
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-none">
                {notebookEntry.title}
              </h1>
              <div className="h-1 w-16 bg-orange-600 rounded-full mt-4" />
            </div>

            <section id="introduction" className="space-y-3.5 scroll-mt-20">
              <h2 className="text-base font-black text-slate-100 tracking-tight">Introduction</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">{notebookEntry.introduction}</p>
            </section>

            <section id="constraints" className="space-y-3.5 scroll-mt-20">
              <h2 className="text-base font-black text-slate-100 tracking-tight">Design Constraints</h2>
              <ul className="space-y-2 list-disc pl-5">
                {notebookEntry.designConstraints.map((constraint) => (
                  <li key={constraint} className="text-xs text-slate-400 leading-normal font-semibold">
                    {constraint}
                  </li>
                ))}
              </ul>
            </section>

            <section id="sketches" className="space-y-4 scroll-mt-20">
              <h2 className="text-base font-black text-slate-100 tracking-tight">Concept Sketches</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                {notebookEntry.conceptSketchesDescription}
              </p>

        
            </section>

            <section id="prototypes" className="space-y-3.5 scroll-mt-20">
              <h2 className="text-base font-black text-slate-100 tracking-tight">Prototypes</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">{notebookEntry.prototypesText}</p>
            </section>

            <section id="results" className="space-y-3.5 scroll-mt-20">
              <h2 className="text-base font-black text-slate-100 tracking-tight">Testing Results</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">{notebookEntry.testingResults}</p>
            </section>

            <section id="conclusion" className="space-y-3.5 scroll-mt-20">
              <h2 className="text-base font-black text-slate-100 tracking-tight">Conclusion</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">{notebookEntry.conclusion}</p>
            </section>

            <section id="steps" className="space-y-3.5 scroll-mt-20">
              <h2 className="text-base font-black text-slate-100 tracking-tight">Next Steps</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">{notebookEntry.nextSteps}</p>
            </section>
          </article>
        )}
      </div>

      <aside className="w-[200px] bg-white dark:bg-[#070b13] border-l border-slate-200 dark:border-slate-900 flex flex-col h-full select-none p-5">
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest block mb-4 border-b border-slate-200 dark:border-slate-900 pb-2">
          Table of Contents
        </span>

        <div className="space-y-1">
          {TABLE_OF_CONTENTS.map((toc) => {
            const isSelected = isActiveDoc && activeTocSegment === toc.id;

            return (
              <button
                key={toc.id}
                type="button"
                disabled={!isActiveDoc}
                onClick={() => scrollToSection(toc.id)}
                className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-semibold leading-normal transition flex items-center gap-1.5 ${
                  !isActiveDoc
                    ? "text-slate-500 dark:text-slate-700 cursor-not-allowed"
                    : isSelected
                      ? "bg-orange-600/10 text-orange-400 font-bold border-l border-orange-500 cursor-pointer"
                      : "text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/10 cursor-pointer"
                }`}
              >
                <div className={`h-1 w-1 rounded-full ${isSelected ? "bg-orange-400" : "bg-slate-400 dark:bg-slate-600"}`} />
                <span>{toc.label}</span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
