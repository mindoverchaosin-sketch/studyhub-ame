import React from 'react';
import { render, fireEvent, within } from '@testing-library/react';
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

  it('keeps a long form scrollable while the header and footer stay available', () => {
    const onClose = vi.fn();
    const { getByRole, getByText } = render(
      <Modal
        open
        title="Long form"
        onClose={onClose}
        footer={<button type="button">Save</button>}
      >
        <div>{Array.from({ length: 40 }, (_, index) => <p key={index}>Long form section {index + 1}</p>)}</div>
      </Modal>,
    );

    const dialog = getByRole('dialog');
    const content = dialog.querySelector('.overflow-y-auto');

    expect(dialog.className).toContain('max-h-[calc(100dvh-2rem)]');
    expect(content).not.toBeNull();
    expect(within(content as HTMLElement).getByText('Long form section 40')).toBeInTheDocument();
    expect(content).not.toContainElement(getByText('Save'));
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
