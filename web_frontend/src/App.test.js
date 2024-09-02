import { render, screen } from '@testing-library/react';
import App from './App';

test('App renders', () => {
  // Arrange
  // Act
  render(<App />);

  // Assert
  const element = screen.getByText('Signup now');
  expect(element).toBeInTheDocument();
});
