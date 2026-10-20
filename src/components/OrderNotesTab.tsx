import { useState, type FormEvent } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { apiErrorMessage } from '@/utils/error';
import { orderNotesService } from '@/services/orderNotes.admin.service';

/**
 * OrderNotesTab — admin view of the buyer↔seller note thread for an order.
 *
 * Surfaces the conversation (plus admin-authored internal notes) so an admin
 * has full context when moderating a dispute. Admins can pin a note to the top
 * of the thread and add internal annotations that are hidden from buyer/seller.
 */
export function OrderNotesTab({ orderId }: { orderId: string }) {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, loading, error, refetch } = useAsync(
    () => orderNotesService.getOrderNotes(orderId),
    [orderId]
  );

  const notes = data ?? [];

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string
  ) => {
    setBusy(true);
    try {
      await action();
      showToast({ type: 'success', message: successMessage });
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        message: apiErrorMessage(err, t('Could not update this note')),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleAddNote = (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    void runAction(async () => {
      await orderNotesService.addNote(orderId, message, { isInternal: true });
      setDraft('');
    }, t('Note added'));
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="card-h2 dark:text-white">{t('Order Notes')}</h2>
        <StatusBadge label={`${notes.length}`} variant="neutral" />
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-gray-500">
          {t('No notes have been added to this order yet.')}
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note._id}
              className={`rounded-lg border p-3 ${
                note.isPinned
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20'
                  : 'border-gray-200 dark:border-dark-600'
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge
                    label={note.userRole || 'UNKNOWN'}
                    variant={note.userRole === 'BUYER' ? 'info' : 'warning'}
                  />
                  {note.isPinned && (
                    <StatusBadge label={t('Pinned')} variant="warning" />
                  )}
                  {note.isInternal && (
                    <StatusBadge label={t('Internal')} variant="neutral" />
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {note.createdAt
                    ? new Date(note.createdAt).toLocaleString()
                    : '—'}
                </span>
              </div>

              <p className="text-sm text-gray-800 dark:text-gray-100">
                {note.message}
              </p>

              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busy}
                  onClick={() =>
                    void runAction(
                      () =>
                        orderNotesService.setPinned(note._id, !note.isPinned),
                      note.isPinned ? t('Note unpinned') : t('Note pinned')
                    )
                  }
                >
                  {note.isPinned ? t('Unpin') : t('Pin')}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={busy}
                  onClick={() =>
                    void runAction(
                      () => orderNotesService.deleteNote(note._id),
                      t('Note deleted')
                    )
                  }
                >
                  {t('Delete')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add internal note */}
      <form onSubmit={handleAddNote} className="mt-4">
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          {t('Add internal note')}
        </label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder={t('Internal note (not visible to buyer or seller)')}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
        />
        <div className="mt-2">
          <Button
            type="submit"
            size="sm"
            disabled={!draft.trim()}
            loading={busy}
          >
            {t('Add Note')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default OrderNotesTab;