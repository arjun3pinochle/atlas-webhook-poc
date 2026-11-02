import { Modal } from "@/components/Modal";
import { JsonViewer } from "@/components/JsonViewer";
import { formatTimestamp, sourceLabel } from "@/services/integrations";
import type { AtlasEvent } from "@/types";

interface EventDetailsModalProps {
  event: AtlasEvent | null;
  open: boolean;
  onClose: () => void;
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-4 sm:gap-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd
        className={`sm:col-span-3 text-sm text-slate-800 ${
          mono ? "font-mono break-all" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export function EventDetailsModal({
  event,
  open,
  onClose,
}: EventDetailsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Event details"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Close
        </button>
      }
    >
      {event ? (
        <div className="space-y-6">
          <dl className="space-y-4">
            <Field label="Event ID" value={event.id} mono />
            <Field label="Source" value={sourceLabel(event.source)} />
            <Field label="Event type" value={event.event_type} />
            <Field label="Received at" value={formatTimestamp(event.received_at)} />
            <Field label="UTC" value={event.received_at} mono />
          </dl>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                Original payload
              </h3>
              <span className="text-xs text-slate-400">
                Preserved exactly as received
              </span>
            </div>
            <JsonViewer data={event.payload.original} />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
