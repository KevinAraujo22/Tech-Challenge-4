import { useEffect, useState } from 'react';

type State<T> = { data: T | null; error: string | null };

// Carrega um recurso da API ao montar a tela (e quando `fetcher` muda).
// `fetcher` deve ser estável: envolva-o em useCallback com suas dependências.
export function useResource<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<State<T>>({ data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true; // ignora respostas que chegam depois de sair da tela
    fetcher().then(
      (data) => active && setState({ data, error: null }),
      (err: Error) => active && setState((s) => ({ ...s, error: err.message }))
    );
    return () => {
      active = false;
    };
  }, [fetcher, attempt]);

  const reload = () => {
    setState((s) => ({ ...s, error: null }));
    setAttempt((n) => n + 1);
  };

  // Atualização local depois de uma ação (ex.: novo comentário).
  const setData = (update: (current: T | null) => T | null) =>
    setState((s) => ({ ...s, data: update(s.data) }));

  return { ...state, reload, setData };
}
