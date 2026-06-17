import type { Meta, StoryObj } from '@storybook/react';

import { ErrorBoundary } from './ErrorBoundary';

const BuggyComponent = (): React.JSX.Element => {
  throw new Error('This is a simulated crash!');
};

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Feedback/ErrorBoundary',
  component: ErrorBoundary,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['page', 'section'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

export const PageLevel: Story = {
  args: {
    variant: 'page',
    children: <BuggyComponent />,
  },
};

export const SectionLevel: Story = {
  args: {
    variant: 'section',
    children: <BuggyComponent />,
  },
};

export const NormalState: Story = {
  args: {
    variant: 'section',
    children: (
      <div style={{ padding: '2rem', border: '1px solid #ccc' }}>
        This content is rendered normally because there are no errors.
      </div>
    ),
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark" style={{ padding: '2rem', background: '#111' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    variant: 'section',
    children: <BuggyComponent />,
  },
};
