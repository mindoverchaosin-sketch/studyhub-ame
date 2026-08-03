import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from '@/components/admin/cms/Modal';

describe('Modal accessibility', () => {
  it('focuses the dialog on open and closes on Escape', () => {
    const onClose = vi.fn();

    const { getByRole } = render(
      <Modal open={true} title="Test Dialog" description="desc" onClose={onClose}>
        <button>First</button>
        <button>Last</button>
      </Modal>
    );

    const dialog = getByRole('dialog');
    // dialog container should be focused
    expect(document.activeElement).toBe(dialog);

    // pressing Escape should call onClose
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
