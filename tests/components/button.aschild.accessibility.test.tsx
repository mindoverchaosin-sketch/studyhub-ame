import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '@/components/ui/Button';

describe('Button asChild accessibility', () => {
  it('is focusable and activates on click', () => {
    const onClick = vi.fn();

    const { getByRole } = render(
      <Button asChild onClick={onClick}>
        <a href="#">Link</a>
      </Button>
    );

    // As the child is an anchor, it exposes role 'link' rather than 'button'
    const el = getByRole('link');
    el.focus();
    expect(document.activeElement).toBe(el);

    // Verify click programmatically triggers the handler
    fireEvent.click(el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
