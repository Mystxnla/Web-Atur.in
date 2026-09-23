const COLUMNS = [
  {
    title: 'To Do',
    color: 'bg-gray-100',
    cards: [
      { title: 'Draft Proposal BAB 1', tag: 'Andi', tagColor: 'bg-blue-100 text-blue-700' },
      { title: 'Kumpulkan referensi jurnal', tag: 'Budi', tagColor: 'bg-purple-100 text-purple-700' },
    ],
  },
  {
    title: 'In Progress',
    color: 'bg-primary-50',
    cards: [
      { title: 'Review metodologi penelitian', tag: 'Citra', tagColor: 'bg-orange-100 text-orange-700', progress: 60 },
    ],
  },
  {
    title: 'Done',
    color: 'bg-success-50',
    cards: [
      { title: 'Pembagian peran anggota', tag: 'Tim', tagColor: 'bg-success-100 text-success-700' },
    ],
  },
];

export default function KanbanPreview() {
  return (
    <div
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 select-none"
      aria-hidden="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-gray-400">Workspace Tim</div>
          <div className="text-sm font-bold text-gray-800">Skripsi Kelompok 9</div>
        </div>
        <div className="flex gap-1">
          {['bg-red-400', 'bg-yellow-400', 'bg-green-400'].map((c, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />
          ))}
        </div>
      </div>

      {/* Sprint bar */}
      <div className="mb-4 px-3 py-2 bg-primary-50 rounded-xl text-xs text-primary-700 font-medium flex items-center justify-between">
        <span>Sprint 3 — Minggu ini</span>
        <span className="font-bold">4/7 task</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {COLUMNS.map((col) => (
          <div key={col.title} className={`${col.color} rounded-xl p-2`}>
            <div className="text-xs font-semibold text-gray-600 mb-2 px-1">{col.title}</div>
            <div className="space-y-2">
              {col.cards.map((card, i) => (
                <div key={i} className="bg-white rounded-lg p-2 shadow-sm border border-white">
                  <p className="text-xs text-gray-700 font-medium leading-snug mb-1.5">{card.title}</p>
                  {card.progress !== undefined && (
                    <div className="w-full bg-gray-200 rounded-full h-1 mb-1.5">
                      <div className="bg-primary-500 h-1 rounded-full" style={{ width: `${card.progress}%` }} />
                    </div>
                  )}
                  <span className={`inline-block text-xs px-1.5 py-0.5 rounded-md font-medium ${card.tagColor}`}>
                    {card.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
