import React, { useState, useEffect } from 'react';
import { DataTable } from '@/components/tables/DataTable';
import { Modal, Button, Input, Textarea } from '@/components/common';
import { reviewsService, Review } from '@/services/reviews.service';
import { useToast } from '@/hooks/useToast';

export const ReviewsModerationPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const { toast } = useToast();

  const limit = 20;

  useEffect(() => {
    loadReviews();
  }, [page]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const result = await reviewsService.getPendingReviews(page, limit);
      setReviews(result.reviews);
      setTotal(result.total);
    } catch (err) {
      toast({ message: 'Failed to load reviews', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReview) return;
    try {
      await reviewsService.approveReview(selectedReview.productId, selectedReview._id);
      toast({ message: 'Review approved', type: 'success' });
      setSelectedReview(null);
      setAction(null);
      loadReviews();
    } catch (err) {
      toast({ message: 'Failed to approve review', type: 'error' });
    }
  };

  const handleReject = async () => {
    if (!selectedReview) return;
    try {
      await reviewsService.rejectReview(selectedReview.productId, selectedReview._id, rejectReason);
      toast({ message: 'Review rejected', type: 'success' });
      setSelectedReview(null);
      setAction(null);
      setRejectReason('');
      loadReviews();
    } catch (err) {
      toast({ message: 'Failed to reject review', type: 'error' });
    }
  };

  const columns = [
    { header: 'Product', accessor: 'productName', width: '20%' },
    { header: 'Author', accessor: (row: Review) => row.author.name, width: '15%' },
    { header: 'Rating', accessor: (row: Review) => `${row.rating}⭐`, width: '10%' },
    { header: 'Comment', accessor: 'comment', width: '35%' },
    { header: 'Status', accessor: 'status', width: '10%' },
    {
      header: 'Actions',
      width: '10%',
      cell: (row: Review) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              setSelectedReview(row);
              setAction('approve');
            }}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setSelectedReview(row);
              setAction('reject');
            }}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Review Moderation</h1>
        <span className="text-sm text-gray-600">Total pending: {total}</span>
      </div>

      <DataTable
        columns={columns}
        data={reviews}
        loading={loading}
        pagination={{ page, setPage, limit, total }}
      />

      {action === 'approve' && selectedReview && (
        <Modal
          title="Approve Review?"
          open={true}
          onClose={() => {
            setAction(null);
            setSelectedReview(null);
          }}
        >
          <div className="space-y-4">
            <p>Product: {selectedReview.productName}</p>
            <p>Author: {selectedReview.author.name}</p>
            <p>Rating: {selectedReview.rating}⭐</p>
            <p>Comment: {selectedReview.comment}</p>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleApprove} variant="primary">
                Approve
              </Button>
              <Button
                onClick={() => {
                  setAction(null);
                  setSelectedReview(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {action === 'reject' && selectedReview && (
        <Modal
          title="Reject Review"
          open={true}
          onClose={() => {
            setAction(null);
            setSelectedReview(null);
            setRejectReason('');
          }}
        >
          <div className="space-y-4">
            <p>Product: {selectedReview.productName}</p>
            <Textarea
              label="Rejection Reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why are you rejecting this review?"
            />
            <div className="flex gap-2 pt-4">
              <Button onClick={handleReject} variant="destructive">
                Reject
              </Button>
              <Button
                onClick={() => {
                  setAction(null);
                  setSelectedReview(null);
                  setRejectReason('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
