import CustomPicker from '@/components/CustomPicker';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    MaterialCommunityIcons: ({ name }: { name: string }) =>
      React.createElement('View', { testID: `icon-${name}` }),
  };
});

const items = [
  { label: 'Apple', value: 'apple', icon: '🍏' },
  { label: 'Banana', value: 'banana', icon: '🍌' },
  { label: 'Cherry', value: 'cherry', icon: '🍒' },
];

describe('CustomPicker', () => {
  it('renders placeholder when no value is selected', () => {
    render(
      <CustomPicker items={items} selectedValue={''} onValueChange={jest.fn()} placeholder="Pick a fruit" />
    );
    expect(screen.getByText('Pick a fruit')).toBeTruthy();
  });

  it('opens modal on press and renders items', () => {
    render(
      <CustomPicker items={items} selectedValue={''} onValueChange={jest.fn()} placeholder="Pick a fruit" />
    );
    fireEvent.press(screen.getByText('Pick a fruit'));
    expect(screen.getByText('Apple')).toBeTruthy();
    expect(screen.getByText('Banana')).toBeTruthy();
    expect(screen.getByText('Cherry')).toBeTruthy();
  });

  it('calls onValueChange when an item is selected', () => {
    const onValueChange = jest.fn();
    render(
      <CustomPicker items={items} selectedValue={''} onValueChange={onValueChange} placeholder="Pick a fruit" />
    );
    fireEvent.press(screen.getByText('Pick a fruit'));
    fireEvent.press(screen.getByText('Banana'));
    expect(onValueChange).toHaveBeenCalledWith('banana');
  });
});
