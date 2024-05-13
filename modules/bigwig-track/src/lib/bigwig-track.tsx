import styles from './bigwig-track.module.css';

/* eslint-disable-next-line */
export interface BigwigTrackProps {}

export function BigwigTrack(props: BigwigTrackProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to BigwigTrack!</h1>
    </div>
  );
}

export default BigwigTrack;
