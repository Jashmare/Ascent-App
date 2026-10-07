import { useEffect, useRef, useState, type FormEvent } from 'react';
import { navigate } from '../../app/router';
import { syncThemeColor } from '../../app/theme';
import { useToday } from '../../app/useToday';
import { Button } from '../../components/Button';
import { TextField } from '../../components/Field';
import { addDream } from '../../db/dreams';
import { setSetting } from '../../db/settings';
import { addTask } from '../../db/tasks';
import { RestoreBackup } from '../settings/RestoreBackup';
import { SkyBackdrop } from '../sky/SkyBackdrop';
import styles from './Onboarding.module.css';

/**
 * First run (docs/PRODUCT.md §7): "Start with the sky." One dream first (skippable), then
 * one thing to do today. Lead with hope, then action. Lands on Camp with the glimpse
 * already showing the dream just added.
 */
export function Onboarding() {
  const today = useToday();
  const [step, setStep] = useState<'dream' | 'task'>('dream');
  const [dream, setDream] = useState('');
  const [task, setTask] = useState('');
  const [error, setError] = useState<string>();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(true);

  useEffect(() => {
    document.documentElement.dataset.altitude = step === 'dream' ? 'sky' : 'camp';
    syncThemeColor();
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  async function saveDream(event: FormEvent) {
    event.preventDefault();
    if (!dream.trim()) {
      setError('Write a few words about your dream, or skip for now.');
      return;
    }
    await addDream({ title: dream });
    setError(undefined);
    setStep('task');
  }

  async function saveTask(event: FormEvent) {
    event.preventDefault();
    if (!task.trim()) {
      setError('Write one thing to do today, or skip for now.');
      return;
    }
    await addTask({ title: task, date: today });
    await finish();
  }

  async function finish() {
    navigate({ screen: 'camp' }, { replace: true });
    await setSetting('onboarded', true);
  }

  if (step === 'dream') {
    return (
      <div className={styles.screen} data-altitude="sky">
        <SkyBackdrop visible />
        <main className={styles.content}>
          <p className={styles.brand}>Ascent</p>
          <h1 className={styles.titleSky} ref={headingRef} tabIndex={-1}>
            Start with the sky.
          </h1>
          <p className={styles.lead}>
            Everything you do today is part of a climb. Above every summit is the open sky: the
            dreams you’re reaching for.
          </p>
          <form className={styles.form} onSubmit={saveDream} noValidate>
            <TextField
              label="What’s one thing you dream of?"
              serif
              value={dream}
              onChange={(event) => {
                setDream(event.target.value);
                setError(undefined);
              }}
              placeholder="A studio by the sea"
              hint="No deadline needed. You can add more any time."
              error={error}
              maxLength={160}
              autoComplete="off"
            />
            <div className={styles.actions}>
              <Button variant="primary" type="submit">
                Add to my sky
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setError(undefined);
                  setStep('task');
                }}
              >
                Skip for now
              </Button>
            </div>
          </form>
          <div className={styles.restore}>
            <p className={styles.restoreLead}>Moving from another phone or browser?</p>
            <RestoreBackup variant="link" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.screen} data-altitude="camp">
      <main className={styles.content}>
        <p className={styles.brand}>Ascent</p>
        <h1 className={styles.titleCamp} ref={headingRef} tabIndex={-1}>
          And one thing to do today.
        </h1>
        <p className={styles.lead}>
          Camp is where each day starts. Small steps here carry you up to the ridge, the summit and
          the sky.
        </p>
        <form className={styles.form} onSubmit={saveTask} noValidate>
          <TextField
            label="What’s one thing you’ll do today?"
            value={task}
            onChange={(event) => {
              setTask(event.target.value);
              setError(undefined);
            }}
            placeholder="Go for a morning walk"
            error={error}
            maxLength={200}
            autoComplete="off"
          />
          <div className={styles.actions}>
            <Button variant="primary" type="submit">
              Add task
            </Button>
            <Button variant="ghost" onClick={() => finish()}>
              Skip for now
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
