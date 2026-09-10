export const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'На проверке', approved: 'Одобрен', rejected: 'Отклонён',
};
