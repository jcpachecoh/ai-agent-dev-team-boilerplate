import { describe, expect, it } from 'vitest';

import { downloadExportBlob } from './download-export-blob';

describe('downloadExportBlob', () => {
  it('creates an object URL and triggers download', () => {
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    const click = vi.fn();

    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    vi.spyOn(document, 'createElement').mockReturnValue({
      click,
      href: '',
      download: '',
    } as HTMLAnchorElement);

    downloadExportBlob(new Blob(['test']), 'reporte.pdf');

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});
