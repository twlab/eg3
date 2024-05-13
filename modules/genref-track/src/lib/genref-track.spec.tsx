import { render } from '@testing-library/react';

import GenrefTrack from './genref-track';

describe('GenrefTrack', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<GenrefTrack />);
    expect(baseElement).toBeTruthy();
  });
});
