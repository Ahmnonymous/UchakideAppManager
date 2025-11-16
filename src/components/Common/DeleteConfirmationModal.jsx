import React from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap";

const DeleteConfirmationModal = ({
  isOpen,
  toggle,
  onConfirm,
  title = "Confirm Deletion",
  message,
  itemName,
  itemType = "item",
  loading = false,
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      toggle={toggle} 
      centered 
      backdrop="static"
      size="md"
    >
      <ModalHeader toggle={toggle} className="border-0 pb-2">
        <div className="d-flex align-items-center">
          <div className="flex-shrink-0 me-3">
            <div className="delete-icon">
              <i className="bx bx-trash"></i>
            </div>
          </div>
          <div className="flex-grow-1">
            <h5 className="mb-0 text-danger fw-semibold">{title}</h5>
          </div>
        </div>
      </ModalHeader>
      
      <ModalBody className="pt-2 pb-3">
        <div className="text-center">
          {/* Warning Icon */}
          {/* <div className="warning-icon mb-3">
            <i className="bx bx-error-circle"></i>
          </div> */}
          
          {/* Main Message */}
          <div className="delete-message mb-3">
            <p className="text-body mb-2">
              {message || `Are you sure you want to delete this ${itemType}?`}
            </p>
            
            {/* Item Name Highlight */}
            {/* {itemName && (
              <div className="item-name-highlight mb-3">
                <div className="item-badge">
                  <i className="bx bx-file me-2"></i>
                  <span className="fw-medium">"{itemName}"</span>
                </div>
              </div>
            )} */}
          </div>
          
          {/* Warning Text */}
          <div className="warning-text">
            <div className="alert alert-warning border-0 mb-0">
              <i className="bx bx-info-circle me-2"></i>
              <small>
                <strong>Warning:</strong> This action cannot be undone.
              </small>
            </div>
          </div>
        </div>
      </ModalBody>
      
      <ModalFooter className="border-0 pt-0">
        <div className="d-flex gap-2 w-100">
          <Button
            color="light"
            onClick={toggle}
            disabled={loading}
            className="flex-fill"
          >
            <i className="bx bx-x me-1"></i>
            Cancel
          </Button>
          <Button
            color="danger"
            onClick={onConfirm}
            disabled={loading}
            className="flex-fill"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Deleting...
              </>
            ) : (
              <>
                <i className="bx bx-trash me-1"></i>
                Delete {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
              </>
            )}
          </Button>
        </div>
      </ModalFooter>
      
      <style jsx>{`
        .delete-icon {
          width: 40px;
          height: 40px;
          background-color: #dc3545;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .delete-icon i {
          font-size: 20px;
          color: white;
        }
        
        .warning-icon {
          width: 60px;
          height: 60px;
          background-color: #ffc107;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        
        .warning-icon i {
          font-size: 28px;
          color: white;
        }
        
        .item-name-highlight {
          margin: 12px 0;
        }
        
        .item-badge {
          display: inline-flex;
          align-items: center;
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 8px 16px;
        }
        
        .item-badge i {
          color: #6c757d;
          font-size: 16px;
        }
        
        .alert-warning {
          border-radius: 8px;
          padding: 12px;
        }
        
        .modal-content {
          border-radius: 12px;
          border: none;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </Modal>
  );
};

export default DeleteConfirmationModal;