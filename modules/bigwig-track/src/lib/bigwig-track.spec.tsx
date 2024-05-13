import { render } from '@testing-library/react';

import BigwigTrack from './bigwig-track';

describe('BigwigTrack', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<BigwigTrack />);
    expect(baseElement).toBeTruthy();
  });
});
