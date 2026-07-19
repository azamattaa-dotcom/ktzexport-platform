'use client';
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
    >
      📥 Скачать / Распечатать PDF
    </button>
  );
}
