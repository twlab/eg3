import styles from './dynseq-track.module.css';

/* eslint-disable-next-line */
export interface DynseqTrackProps {}

export function DynseqTrack(props: DynseqTrackProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to DynseqTrack!</h1>
    </div>
  );
}

export default DynseqTrack;
