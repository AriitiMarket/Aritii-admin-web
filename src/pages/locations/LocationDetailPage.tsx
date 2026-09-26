import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { Modal } from '@/components/common/Modal';
import { LocationForm } from '@/components/locations/LocationForm';
import { LocationTree } from '@/components/locations/LocationTree';
import {
  locationsService,
} from '@/services/locations.service';
import { useAsync } from '@/hooks/useAsync';

const TYPE_LABELS: Record<string, string> = {
  country: '🌍 Country',
  region: '📍 Region',
  city: '🏙️ City',
  town: '🏘️ Town',
  area: '🗺️ Area',
  sector: '📐 Sector',
  community: '👥 Community',
  village: '🏡 Village',
  rural: '🌾 Rural',
  other: '📌 Other',
};

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: location,
    loading,
    error,
    refetch,
  } = useAsync(() => locationsService.get(id!), [id]);

  const {
    data: children,
    loading: childrenLoading,
    refetch: refetchChildren,
  } = useAsync(() => locationsService.getChildren(id!), [id]);

  const {
    data: ancestors,
    loading: ancestorsLoading,
  } = useAsync(() => locationsService.getAncestors(id!), [id]);

  const [showEdit, setShowEdit] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleToggleActive() {
    if (!location) return;
    setToggling(true);
    try {
      if (location.isActive) {
        await locationsService.deactivate(location._id);
      } else {
        await locationsService.activate(location._id);
      }
      refetch();
    } catch (err) {
      console.error('Failed to toggle location:', err);
    } finally {
      setToggling(false);
    }
  }

  if (loading || ancestorsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error || 'Location not found'}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/locations')}
        >
          Back to Locations
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={location.name}
        description={`${TYPE_LABELS[location.type] || location.type} • ID: ${location._id}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/locations')}>
              Back
            </Button>
            <Button variant="outline" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            <Button
              variant={location.isActive ? 'danger' : 'primary'}
              loading={toggling}
              onClick={handleToggleActive}
            >
              {location.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        }
      />

      {/* Breadcrumb */}
      {ancestors && ancestors.length > 0 && (
        <nav className="mb-4 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/locations" className="hover:text-primary-dark hover:underline">
            Locations
          </Link>
          {ancestors.map((a) => (
            <span key={a._id} className="flex items-center gap-1">
              <span>/</span>
              <Link
                to={`/locations/${a._id}`}
                className="hover:text-primary-dark hover:underline"
              >
                {a.name}
              </Link>
            </span>
          ))}
          <span>/</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {location.name}
          </span>
        </nav>
      )}

      {/* Detail grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main info */}
        <Card className="p-4 lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            Details
          </h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Name
              </dt>
              <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">
                {location.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Type
              </dt>
              <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">
                {TYPE_LABELS[location.type] || location.type}
              </dd>
            </div>
            {location.code && (
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Code
                </dt>
                <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">
                  {location.code}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Status
              </dt>
              <dd className="mt-0.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    location.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {location.isActive ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>
            {location.parentId && (
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Parent
                </dt>
                <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">
                  <Link
                    to={`/locations/${location.parentId}`}
                    className="text-primary-dark hover:underline"
                  >
                    View parent
                  </Link>
                </dd>
              </div>
            )}
            {location.description && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Description
                </dt>
                <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">
                  {location.description}
                </dd>
              </div>
            )}
            {location.coordinates && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Coordinates
                </dt>
                <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">
                  {location.coordinates.coordinates[1]},{' '}
                  {location.coordinates.coordinates[0]}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Quick actions */}
        <Card className="p-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
          <div className="space-y-2">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setShowAddChild(true)}
            >
              Add Child Location
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setShowEdit(true)}
            >
              Edit Details
            </Button>
            <Button
              className="w-full"
              variant={location.isActive ? 'danger' : 'primary'}
              loading={toggling}
              onClick={handleToggleActive}
            >
              {location.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Children */}
      <Card className="mt-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Children
          </h2>
          <Button size="sm" onClick={() => setShowAddChild(true)}>
            Add Child
          </Button>
        </div>
        {childrenLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : children && children.length > 0 ? (
          <LocationTree
            nodes={children.map((c) => ({ ...c, children: [] }))}
            selectedId={null}
          />
        ) : (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No child locations. Click "Add Child" to create one.
          </p>
        )}
      </Card>

      {/* Edit modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Location"
      >
        <LocationForm
          initial={location}
          onSuccess={() => {
            setShowEdit(false);
            refetch();
          }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>

      {/* Add child modal */}
      <Modal
        open={showAddChild}
        onClose={() => setShowAddChild(false)}
        title="Add Child Location"
      >
        <LocationForm
          parentId={location._id}
          parentType={location.type}
          onSuccess={() => {
            setShowAddChild(false);
            refetch();
            refetchChildren();
          }}
          onCancel={() => setShowAddChild(false)}
        />
      </Modal>
    </div>
  );
}
