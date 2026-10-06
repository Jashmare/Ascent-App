import { useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { Button } from '../../components/Button';
import { TextArea } from '../../components/Field';
import { Sheet } from '../../components/Sheet';
import { cancelReach, confirmReach, useReachState, type ReachTarget } from './reach';
import styles from './Sky.module.css';

/** "How does it feel to be here?" — an optional reflection before the ceremony. */
export function ReachSheet() {
  const { request } = useReachState();
  if (!request) return null;
  return <ReachPrompt key={`${request.kind}:${request.id}`} target={request} />;
}

function ReachPrompt({ target }: { target: ReachTarget }) {
  const reducedMotion = useReducedMotion() ?? false;
  const [reflection, setReflection] = useState('');
  const [busy, setBusy] = useState(false);
  const action = target.kind === 'summit' ? 'Reach the summit' : 'Mark as reached';

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
              await confirmReach(reflection, reducedMotion);
            }}
          >
            {action}
          </Button>
          <Button onClick={cancelReach}>Not yet</Button>
        </>
      }
    >
      <p className={styles.reachTitle}>{target.title}</p>
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
