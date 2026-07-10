import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { AsistenciaTarjetaMarkingModal } from './AsistenciaTarjetaMarkingModal';

const meta: Meta<typeof AsistenciaTarjetaMarkingModal> = {
  title: 'Asistencia/AsistenciaTarjetaMarkingModal',
  component: AsistenciaTarjetaMarkingModal,
};

export default meta;

type Story = StoryObj<typeof AsistenciaTarjetaMarkingModal>;

function ModalDemo(): JSX.Element {
  const [changeReason, setChangeReason] = useState('');
  const [marks, setMarks] = useState([
    {
      id: 'draft-1',
      type: 'ENTRY' as const,
      datetimeLocal: '2026-06-10T08:00:00',
    },
  ]);

  return (
    <AsistenciaTarjetaMarkingModal
      open
      dateLabel="10 jun 2026"
      marks={marks}
      changeReason={changeReason}
      existingMarks={[
        {
          id: 'log-1',
          type: 'ENTRY',
          timeLabel: '07:58',
          source: 'DEVICE',
        },
      ]}
      onClose={() => undefined}
      onReset={() => setChangeReason('')}
      onSave={() => undefined}
      onAddMark={() =>
        setMarks((current) => [
          ...current,
          {
            id: `draft-${current.length + 1}`,
            type: 'EXIT',
            datetimeLocal: '2026-06-10T17:00:00',
          },
        ])
      }
      onRemoveMark={(markId) => setMarks((current) => current.filter((mark) => mark.id !== markId))}
      onMarkTypeChange={(markId, type) =>
        setMarks((current) =>
          current.map((mark) => (mark.id === markId ? { ...mark, type } : mark)),
        )
      }
      onMarkDatetimeChange={(markId, datetimeLocal) =>
        setMarks((current) =>
          current.map((mark) => (mark.id === markId ? { ...mark, datetimeLocal } : mark)),
        )
      }
      onChangeReasonChange={setChangeReason}
    />
  );
}

export const UnifiedCatalog: Story = {
  render: () => <ModalDemo />,
};
