import React, { useEffect, useMemo, useState } from 'react';

// Prime React
import { DataTableRowClickEvent } from 'primereact/datatable';

// Interface and Types
import {
  IUserResponse,
} from '@/lib/utils/interfaces/users.interface';

// Components
import Table from '@/lib/ui/useable-components/table';

import { IDropdownSelectItem } from '@/lib/utils/interfaces';
import { USERS_TABLE_COLUMNS } from '@/lib/ui/useable-components/table/columns/user-columns';
import { useRouter } from 'next/navigation';

// API
import { adminAPI } from '@/lib/api/api';

interface UsersMainProps {
  debouncedSearch: string;
  registrationMethodFilter: IDropdownSelectItem[];
  accountStatusFilter: IDropdownSelectItem[];
}

export default function UsersMain({
  debouncedSearch,
  registrationMethodFilter = [],
  accountStatusFilter = [],
}: UsersMainProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const registrationMethod =
    registrationMethodFilter.length === 1
      ? String(registrationMethodFilter[0].code)
      : undefined;
  const status =
    accountStatusFilter.length === 1
      ? String(accountStatusFilter[0].code)
      : undefined;

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsersPaginated(
        currentPage,
        limit,
        debouncedSearch || undefined,
        registrationMethod,
        status
      );
      setData(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, limit, debouncedSearch, registrationMethod, status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, registrationMethod, status]);

  const paginatedUsers: IUserResponse[] = useMemo(
    () => data?.usersPaginated?.data ?? [],
    [data]
  );

  const handleRowClick = (event: DataTableRowClickEvent) => {
    router.push(`/general/users/user-detail/${event.data._id}`);
  };

  return (
    <div className="flex flex-col gap-3 p-3 w-full overflow-auto">
      <Table
        data={loading ? [] : paginatedUsers}
        columns={USERS_TABLE_COLUMNS(openMenuId, setOpenMenuId)}
        rowsPerPage={limit}
        totalRecords={data?.usersPaginated?.totalCount ?? 0}
        currentPage={data?.usersPaginated?.currentPage ?? currentPage}
        onPageChange={(page, newLimit) => {
          setCurrentPage(page);
          setLimit(newLimit);
        }}
        handleRowClick={handleRowClick}
        loading={loading}
        minWidth="85rem"
      />
    </div>
  );
}
