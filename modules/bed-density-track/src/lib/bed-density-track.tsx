import styles from './bed-density-track.module.css';

/* eslint-disable-next-line */
export interface BedDensityTrackProps {}

export function BedDensityTrack(props: BedDensityTrackProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to BedDensityTrack!</h1>
    </div>
  );
}

export default BedDensityTrack;
