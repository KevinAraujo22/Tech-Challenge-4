import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState, ErrorState, Loading } from '@/components/Feedback';
import { SearchBar } from '@/components/SearchBar';
import { PeopleConfig } from '@/constants/people';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { peopleApi } from '@/services/api';
import type { Page, PeopleKind, Person } from '@/types';
import { confirmAction } from '@/utils/confirm';
import { initials } from '@/utils/format';

const PAGE_SIZE = 8;

// Listagem paginada de professores ou alunos, com editar e excluir em cada linha.
// Alunos: qualquer professor gerencia. Professores: só o administrador gerencia os
// outros; um professor comum vê a lista e edita apenas a própria conta.
export function PeopleList({ kind }: { kind: PeopleKind }) {
  const config = PeopleConfig[kind];
  const api = peopleApi(kind);
  const { user, isAdmin } = useAuth();
  const canManage = kind === 'students' || isAdmin;

  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [data, setData] = useState<Page<Person> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await peopleApi(kind).list(page, PAGE_SIZE, debouncedQuery);
      // Excluir o último item de uma página volta para a anterior.
      if (result.items.length === 0 && page > 1) setPage(page - 1);
      else setData(result);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [kind, page, debouncedQuery]);

  // Recarrega ao voltar das telas de criação/edição.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const search = (text: string) => {
    setQuery(text);
    setPage(1);
  };

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const remove = async (person: Person) => {
    const ok = await confirmAction(
      `Excluir ${config.singular}`,
      `Tem certeza que deseja excluir ${person.name}? Essa ação não pode ser desfeita.`
    );
    if (!ok) return;
    try {
      await api.remove(person._id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const header = (
    <View style={styles.header}>
      <SearchBar value={query} onChangeText={search} placeholder={`Buscar ${config.plural.toLowerCase()} por nome ou e-mail`} />
      <View style={styles.headerRow}>
        <Text style={styles.count}>
          {data ? `${data.total} ${data.total === 1 ? config.singular : config.plural.toLowerCase()}` : ''}
        </Text>
        {canManage ? (
          <Button
            label={config.newTitle}
            icon="add"
            compact
            onPress={() => router.push({ pathname: '/people/[kind]/new', params: { kind } })}
          />
        ) : null}
      </View>
    </View>
  );

  if (error && !data) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <Loading />;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={data.items}
      keyExtractor={(item) => item._id}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.deep} />}
      ListEmptyComponent={
        <EmptyState
          icon={config.icon}
          title={debouncedQuery ? 'Nenhum resultado' : `Nenhum ${config.singular} cadastrado`}
          message={debouncedQuery ? `Nada encontrado para "${debouncedQuery}".` : `Toque em "${config.newTitle}" para começar.`}
        />
      }
      renderItem={({ item }) => {
        const isMe = kind === 'teachers' && item._id === user?.id;
        const extra = item[config.extraField];
        return (
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(item.name)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
                {isMe ? <Text style={styles.me}>  (você)</Text> : null}
              </Text>
              {item.isAdmin ? <Text style={styles.adminTag}>Administrador</Text> : null}
              <Text style={styles.email} numberOfLines={1}>
                {item.email}
              </Text>
              {extra ? <Text style={styles.extra}>{`${config.extraLabel}: ${extra}`}</Text> : null}
            </View>
            {canManage || isMe ? (
              <View style={styles.actions}>
                <Button
                  label="Editar"
                  icon="create-outline"
                  variant="secondary"
                  compact
                  onPress={() => router.push({ pathname: '/people/[kind]/[id]', params: { kind, id: item._id } })}
                />
                {canManage && !isMe ? (
                  <Button label="Excluir" icon="trash-outline" variant="danger" compact onPress={() => remove(item)} />
                ) : null}
              </View>
            ) : null}
          </View>
        );
      }}
      ListFooterComponent={
        data.totalPages > 1 ? (
          <View style={styles.pagination}>
            <Button
              label="Anterior"
              icon="chevron-back"
              variant="secondary"
              compact
              disabled={page <= 1}
              onPress={() => setPage(page - 1)}
            />
            <Text style={styles.pageText}>
              Página {data.page} de {data.totalPages}
            </Text>
            <Button
              label="Próxima"
              icon="chevron-forward"
              variant="secondary"
              compact
              disabled={page >= data.totalPages}
              onPress={() => setPage(page + 1)}
            />
          </View>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: Colors.paper,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
    flexGrow: 1,
  },
  header: {
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  count: {
    color: Colors.muted,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sage,
  },
  avatarText: {
    fontWeight: '700',
    color: Colors.deep,
  },
  info: {
    flex: 1,
    minWidth: 160,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.ink,
  },
  me: {
    fontWeight: '400',
    color: Colors.muted,
  },
  adminTag: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: Colors.deep,
    backgroundColor: Colors.sage,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  email: {
    fontSize: 14,
    color: Colors.muted,
  },
  extra: {
    fontSize: 13,
    color: Colors.deep,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginLeft: 'auto',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  pageText: {
    color: Colors.muted,
    fontSize: 14,
  },
});
