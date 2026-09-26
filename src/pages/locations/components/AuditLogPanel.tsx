// Audit Log Panel Component

import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { SearchInput } from '@/components/common/SearchInput';
import { Pagination } from '@/components/common/Pagination';
import { formatDate } from '@/utils/format';

interface AuditLog {
  id: string;
  actor: string;
  action: string;
  resource: string;
  targetId?: string;
  previousValue?: any;
  newValue?: any;
  timestamp: string;
  ipAddress?: string;
}

interface AuditLogPanelProps {
  entityType: 'location' | 'zone' | 'route';
  entityId: string;
  entityName: string;
}

export function AuditLogPanel({ entityType, entityId, entityName }: AuditLogPanelProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadAuditLogs();
  }, [entityId, page]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call the audit log service
      // For now, we'll use mock data
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          actor: 'Admin User',
          action: `${entityType.toUpperCase()}_UPDATED`,
          resource: entityType,
          targetId: entityId,
          previousValue: { status: 'inactive' },
          newValue: { status: 'active' },
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          ipAddress: '192.168.1.100',
        },
        {
          id: '2',
          actor: 'Admin User',
          action: `${entityType.toUpperCase()}_CREATED`,
          resource: entityType,
          targetId: entityId,
          newValue: { name: entityName },
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          ipAddress: '192.168.1.100',
        },
      ];
      setLogs(mockLogs);
      setTotalPages(1);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATED')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (action.includes('UPDATED')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    if (action.includes('DELETED') || action.includes('DEACTIVATED')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    if (action.includes('ACTIVATED')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredLogs = logs.filter((log) =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.actor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold dark:text-white">Activity Log</h3>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search logs..."
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading activity log...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No activity found
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    log.action.includes('CREATED') ? 'bg-green-500' :
                    log.action.includes('UPDATED') ? 'bg-blue-500' :
                    log.action.includes('DELETED') || log.action.includes('DEACTIVATED') ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                      {formatAction(log.action)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{log.actor}</span>
                    {log.previousValue && (
                      <span className="text-gray-500">
                        {' '}changed from{' '}
                        <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                          {JSON.stringify(log.previousValue)}
                        </code>
                      </span>
                    )}
                    {log.newValue && (
                      <span className="text-gray-500">
                        {' '}to{' '}
                        <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                          {JSON.stringify(log.newValue)}
                        </code>
                      </span>
                    )}
                  </p>
                  {log.ipAddress && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      IP: {log.ipAddress}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            className="mt-4"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </Card>
    </div>
  );
}