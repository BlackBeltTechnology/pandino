import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

const mockBundle = jest.fn() as any;
const mockMeta = jest.fn() as any;

test('renders learn react link', () => {
  render(<App bundle={mockBundle} meta={mockMeta} />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
