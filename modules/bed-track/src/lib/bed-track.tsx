import styles from './bed-track.module.css';

/* eslint-disable-next-line */
export interface BedTrackProps {}

export function BedTrack(props: BedTrackProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to BedTrack!</h1>
    </div>
  );
}

export default BedTrack;
