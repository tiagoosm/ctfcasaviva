import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Select from './Select';

function Harness() {
  const [value, setValue] = useState('');
  return (
    <>
      <label htmlFor="turma">Turma</label>
      <Select id="turma" value={value} onChange={setValue} options={['A1', 'A2', 'B1']} placeholder="Selecione" />
      <button type="button">fora</button>
    </>
  );
}

describe('Select', () => {
  it('can be operated with the keyboard', () => {
    render(<Harness />);
    const field = screen.getByRole('combobox', { name: 'Turma' });
    expect(field).toHaveAttribute('aria-expanded', 'false');

    fireEvent.keyDown(field, { key: 'ArrowDown' });
    expect(field).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(field).toHaveTextContent('A2');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Reopening starts from the current value and marks it as selected
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(screen.getByRole('option', { name: 'A2' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(field, { key: 'End' });
    fireEvent.keyDown(field, { key: ' ' });
    expect(field).toHaveTextContent('B1');
  });

  it('closes without changing the value on Escape or an outside click', () => {
    render(<Harness />);
    const field = screen.getByRole('combobox', { name: 'Turma' });

    fireEvent.click(field);
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.click(field);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'fora' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(field).toHaveTextContent('Selecione');
  });
});
