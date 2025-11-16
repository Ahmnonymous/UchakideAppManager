import { useState } from 'react';

const useDeleteConfirmation = () => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showDeleteConfirmation = (item, onConfirm) => {
    setDeleteItem({
      ...item,
      onConfirm
    });
    setDeleteModalOpen(true);
  };

  const hideDeleteConfirmation = () => {
    setDeleteModalOpen(false);
    setDeleteItem(null);
    setDeleteLoading(false);
  };

  const confirmDelete = async () => {
    if (!deleteItem || !deleteItem.onConfirm) return;
    
    setDeleteLoading(true);
    try {
      await deleteItem.onConfirm();
      hideDeleteConfirmation();
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteLoading(false);
      // Don't hide modal on error, let user try again or cancel
    }
  };

  return {
    deleteModalOpen,
    deleteItem,
    deleteLoading,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDelete
  };
};

export default useDeleteConfirmation;
