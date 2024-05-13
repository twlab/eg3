import { render } from '@testing-library/react';

import BedTrack from './bed-track';

describe('BedTrack', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<BedTrack />);
    expect(baseElement).toBeTruthy();
  });
});
