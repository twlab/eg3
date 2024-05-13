import { render } from '@testing-library/react';

import TrackManager from './track-manager';

describe('TrackManager', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<TrackManager />);
    expect(baseElement).toBeTruthy();
  });
});
