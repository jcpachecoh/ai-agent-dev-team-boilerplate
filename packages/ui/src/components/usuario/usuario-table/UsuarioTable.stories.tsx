import type { Meta, StoryObj } from '@storybook/react';

import { defaultUsuarioDemoRows } from '../shared/usuario-demo-data';
import { usuarioStoryMeta } from '../shared/story-decorators';
import { UsuarioTableItem } from '../usuario-table-item';
import { UsuarioTable } from './UsuarioTable';

const meta: Meta<typeof UsuarioTable> = {
  title: 'Usuario/UsuarioTable',
  component: UsuarioTable,
  ...usuarioStoryMeta,
};

export default meta;
type Story = StoryObj<typeof UsuarioTable>;

export const Default: Story = {
  render: (args) => (
    <UsuarioTable {...args}>
      {defaultUsuarioDemoRows.map((row) => (
        <UsuarioTableItem key={row.id} {...row} theme={args.theme} size={args.size} />
      ))}
    </UsuarioTable>
  ),
};

export const WithoutActions: Story = {
  render: (args) => (
    <UsuarioTable {...args} showActions={false}>
      {defaultUsuarioDemoRows.map((row) => (
        <UsuarioTableItem
          key={row.id}
          {...row}
          showActions={false}
          theme={args.theme}
          size={args.size}
        />
      ))}
    </UsuarioTable>
  ),
};

export const Light: Story = {
  args: { theme: 'light' },
  render: Default.render,
};
