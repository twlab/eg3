import { render } from '@testing-library/react';

import BedDensityTrack from './bed-density-track';

describe('BedDensityTrack', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<BedDensityTrack />);
    expect(baseElement).toBeTruthy();
  });
});
