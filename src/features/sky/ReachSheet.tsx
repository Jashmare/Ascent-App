import { useState } from 'react';
import { Button } from '../../components/Button';
import { TextArea } from '../../components/Field';
import { Sheet } from '../../components/Sheet';
import { cancelReach, confirmReach, useReachState } from './reach';
import styles from './Sky.module.css';

/** "How does it feel to be here?" — an optional reflection before the ceremony. */
export function ReachSheet() {
  const { request } = useReachState();
  if (!request) return null;
  return <ReachPrompt key={`${request.kind}:${request.id}`} />;
}

function ReachPrompt() {
  const { request } = useReachState();
  const [reflection, setReflection] = useState('');
  const [busy, setBusy] = useState(false);
  if (!request) return null;
  const action = request.kind === 'summit' ? 'Reach the summit' : 'Mark as reached';

  return (
    <Sheet
      title={action}
      onClose={cancelReach}
      footer={
        <>
          <Button
            variant="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await confirmReach(reflection);
            }}
          >
            {action}
          </Button>
          <Button onClick={cancelReach}>Not yet</Button>
        </>
      }
    >
      <p className={styles.reachTitle}>{request.title}</p>
      <TextArea
        label="How does it feel to be here?"
        hint="Optional. It’s kept with the star."
        serif
        rows={4}
        value={reflection}
        onChange={(event) => setReflection(event.target.value)}
      />
    </Sheet>
  );
}
