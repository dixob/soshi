'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { PIPELINE_STAGES, type PipelineStage, type PreneedProspect } from '@/types/database';
import { cn, daysSince, daysSinceColor, formatDate, contactName } from '@/lib/utils';
import { Plus, Phone, Calendar, GripVertical, LayoutGrid } from 'lucide-react';
import ProspectDetail from './ProspectDetail';
import NewProspectModal from './NewProspectModal';

export default function PipelinePage() {
  const { prospects } = useStore();
  const [selectedProspect, setSelectedProspect] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const { moveProspect } = useStore();

  const prospectsByStage = PIPELINE_STAGES.map(stage => ({
    ...stage,
    prospects: prospects.filter(p => p.stage === stage.key),
  }));

  const totalProspects = prospects.length;
  const converted = prospects.filter(p => p.stage === 'converted').length;
  const overdueCount = prospects.filter(p => {
    const days = daysSince(p.last_contact_date);
    return days !== null && days > 30 && p.stage !== 'converted';
  }).length;

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e: React.DragEvent, stage: PipelineStage) {
    e.preventDefault();
    if (draggedId) {
      moveProspect(draggedId, stage);
      setDraggedId(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">Preneed Pipeline</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {totalProspects} prospects &middot; {converted} converted
            {overdueCount > 0 && (
              <span className="text-red-600 font-medium"> &middot; {overdueCount} overdue</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Prospect
        </button>
      </div>

      {/* Empty state — no prospects yet */}
      {totalProspects === 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-10 text-center mb-4">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="w-6 h-6 text-stone-400" />
          </div>
          <h2 className="text-base font-semibold text-stone-900 mb-1">No prospects yet</h2>
          <p className="text-stone-500 text-sm mb-5 max-w-xs mx-auto">
            Add a contact first, then convert them to a preneed prospect to start tracking.
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Prospect
          </button>
        </div>
      )}

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar snap-x snap-mandatory md:snap-none">
        {prospectsByStage.map(stage => (
          <div
            key={stage.key}
            className="flex-shrink-0 w-[75vw] sm:w-64 md:w-auto md:flex-1 min-w-[240px] snap-center"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.key)}
          >
            <div className={cn('rounded-lg border p-2', stage.color)}>
              <div className="flex items-center justify-between px-2 py-1 mb-2">
                <h2 className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
                  {stage.label}
                </h2>
                <span className="text-xs text-stone-400 bg-white/60 px-1.5 py-0.5 rounded">
                  {stage.prospects.length}
                </span>
              </div>

              <div className="space-y-2 min-h-[100px]">
                {stage.prospects.map(prospect => (
                  <ProspectCard
                    key={prospect.id}
                    prospect={prospect}
                    onClick={() => setSelectedProspect(prospect.id)}
                    onDragStart={(e) => handleDragStart(e, prospect.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prospect detail slide-over */}
      {selectedProspect && (
        <ProspectDetail
          prospectId={selectedProspect}
          onClose={() => setSelectedProspect(null)}
        />
      )}

      {/* New prospect modal */}
      {showNewModal && (
        <NewProspectModal onClose={() => setShowNewModal(false)} />
      )}
    </div>
  );
}

function ProspectCard({
  prospect,
  onClick,
  onDragStart,
}: {
  prospect: PreneedProspect;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const days = daysSince(prospect.last_contact_date);
  const name = prospect.contact ? contactName(prospect.contact) : 'Unknown';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white rounded-md border border-stone-200 p-3 cursor-pointer hover:shadow-sm active:bg-stone-50 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-900 truncate">{name}</p>
          <p className="text-xs text-stone-400 capitalize mt-0.5">
            {prospect.disposition_pref} &middot; {prospect.lead_source.replaceAll('_', ' ')}
          </p>
        </div>
        <GripVertical className="w-4 h-4 text-stone-300 opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5" />
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs">
        {days !== null && (
          <span className={cn('flex items-center gap-1', daysSinceColor(days))}>
            <Phone className="w-3 h-3" />
            {days === 0 ? 'Today' : `${days}d ago`}
          </span>
        )}
        {prospect.next_followup_date && (
          <span className="flex items-center gap-1 text-stone-400">
            <Calendar className="w-3 h-3" />
            {formatDate(prospect.next_followup_date)}
          </span>
        )}
      </div>
    </div>
  );
}
