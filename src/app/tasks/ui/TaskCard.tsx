import MoveButtons from "./TaskMoveButtons";

export default function TaskCard({
  task,
}: {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    result: string | null;
    updated_at: string;
  };
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="text-sm font-medium text-zinc-900">{task.title}</div>
      {task.description ? <div className="mt-1 text-xs text-zinc-600">{task.description}</div> : null}
      {task.result ? (
        <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
          <div className="font-semibold">Result</div>
          <div className="mt-1 whitespace-pre-wrap">{task.result}</div>
        </div>
      ) : null}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="text-[11px] text-zinc-400">{new Date(task.updated_at).toLocaleString()}</div>
        <MoveButtons id={task.id} status={task.status} />
      </div>
    </div>
  );
}
