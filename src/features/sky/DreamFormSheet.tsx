import { ImagePlus, Trash2 } from 'lucide-react';
import { useId, useState, type ChangeEvent, type FormEvent } from 'react';
import { notify } from '../../app/toast';
import { BlobImage } from '../../components/BlobImage';
import { Button } from '../../components/Button';
import { FieldStack, TextArea, TextField } from '../../components/Field';
import { Sheet } from '../../components/Sheet';
import { addDream, updateDream } from '../../db/dreams';
import type { Dream } from '../../db/types';
import { resizePhoto } from './photo';
import styles from './Sky.module.css';

interface DreamFormSheetProps {
  /** Editing this dream; omitted to add a new one. */
  dream?: Dream;
  onClose: () => void;
}

/**
 * Adding a dream leads with the title, then "Why does this matter to you?", then
 * "Picture it." Only the title is required. A photo is optional.
 */
export function DreamFormSheet({ dream, onClose }: DreamFormSheetProps) {
  const formId = useId();
  const [title, setTitle] = useState(dream?.title ?? '');
  const [why, setWhy] = useState(dream?.why ?? '');
  const [vision, setVision] = useState(dream?.vision ?? '');
  const [photo, setPhoto] = useState<Blob | undefined>(dream?.photo);
  const [titleError, setTitleError] = useState<string>();
  const [photoError, setPhotoError] = useState<string>();
  const [working, setWorking] = useState(false);

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setWorking(true);
    setPhotoError(undefined);
    try {
      setPhoto(await resizePhoto(file));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'That photo couldn’t be added.');
    } finally {
      setWorking(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setTitleError('Give your dream a name. Everything else is optional.');
      return;
    }
    if (dream) {
      await updateDream(dream.id, { title, why, vision, photo: photo ?? null });
      onClose();
      notify('Saved');
    } else {
      await addDream({ title, why, vision, photo });
      onClose();
      notify('Added to your sky');
    }
  }

  return (
    <Sheet
      title={dream ? 'Edit dream' : 'Add a dream'}
      serifTitle
      onClose={onClose}
      footer={
        <>
          <Button variant="primary" type="submit" form={formId} disabled={working}>
            {dream ? 'Save changes' : 'Add to my sky'}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate>
        <FieldStack>
          <TextField
            label="Your dream"
            serif
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setTitleError(undefined);
            }}
            placeholder="A studio by the sea"
            error={titleError}
            maxLength={160}
            autoComplete="off"
            data-autofocus={dream ? undefined : true}
          />
          <TextArea
            label="Why does this matter to you?"
            serif
            rows={3}
            value={why}
            onChange={(event) => setWhy(event.target.value)}
          />
          <TextArea
            label="Picture it."
            hint="What does life look like when this is real?"
            serif
            rows={4}
            value={vision}
            onChange={(event) => setVision(event.target.value)}
          />

          <div className={styles.photoField}>
            <span className={styles.photoLabel}>Photo (optional)</span>
            {photo && (
              <BlobImage blob={photo} alt="The photo for this dream" className={styles.photo} />
            )}
            <div className={styles.photoActions}>
              <label className={styles.photoButton}>
                <ImagePlus aria-hidden="true" />
                {working ? 'Preparing photo…' : photo ? 'Replace photo' : 'Add a photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="visually-hidden"
                  onChange={choosePhoto}
                  disabled={working}
                />
              </label>
              {photo && (
                <Button variant="destructive" icon={<Trash2 />} onClick={() => setPhoto(undefined)}>
                  Remove photo
                </Button>
              )}
            </div>
            {photoError && (
              <p className={styles.photoError} role="alert">
                {photoError}
              </p>
            )}
          </div>
        </FieldStack>
      </form>
    </Sheet>
  );
}
