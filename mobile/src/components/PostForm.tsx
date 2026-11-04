import { useState } from 'react';

import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/Feedback';
import { FormScreen } from '@/components/FormScreen';
import { TextField } from '@/components/TextField';
import type { PostInput } from '@/types';

type PostFormProps = {
  initial: PostInput;
  submitLabel: string;
  onSubmit: (post: PostInput) => Promise<void>;
};

// Formulário compartilhado entre a criação e a edição de postagens.
export function PostForm({ initial, submitLabel, onSubmit }: PostFormProps) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof PostInput, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof PostInput) => (text: string) => setValues((v) => ({ ...v, [field]: text }));

  const submit = async () => {
    const next: typeof errors = {};
    if (!values.title.trim()) next.title = 'Informe o título';
    if (!values.author.trim()) next.author = 'Informe o autor';
    if (!values.content.trim()) next.content = 'Escreva o conteúdo do post';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setServerError(null);
    try {
      await onSubmit({
        title: values.title.trim(),
        author: values.author.trim(),
        content: values.content.trim(),
      });
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormScreen>
      <ErrorBanner message={serverError} />
      <TextField
        label="Título"
        value={values.title}
        onChangeText={set('title')}
        placeholder="Ex.: Revisão para a prova de Ciências"
        error={errors.title}
        maxLength={160}
      />
      <TextField
        label="Autor"
        value={values.author}
        onChangeText={set('author')}
        placeholder="Nome de quem assina o post"
        error={errors.author}
      />
      <TextField
        label="Conteúdo"
        value={values.content}
        onChangeText={set('content')}
        placeholder="Escreva aqui o conteúdo da aula, aviso ou material…"
        error={errors.content}
        multiline
      />
      <Button label={submitLabel} icon="send" onPress={submit} loading={saving} />
    </FormScreen>
  );
}
