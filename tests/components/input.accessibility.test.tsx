import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Input from '@/components/ui/Input';

describe('Input accessibility', () => {
  it('links hint and error with aria-describedby and exposes required', () => {
    const { getByLabelText, getByText } = render(
      <Input label="Name" name="name" required hint="Enter full name" error="Name is required" />
    );

    const input = getByLabelText('Name') as HTMLElement;
    const error = getByText('Name is required');
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(error.id).toBeTruthy();
    expect(input.getAttribute('aria-describedby')?.includes(error.id)).toBe(true);
  });
});
