import { render } from '@testing-library/react';

import DynseqTrack from './dynseq-track';

describe('DynseqTrack', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<DynseqTrack />);
    expect(baseElement).toBeTruthy();
  });
});
