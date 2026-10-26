import { Badge, Modal, Stack, Table, Text } from "@mantine/core";

import { useBalanceLedger } from "../api/hooks";

interface Props {
  userId: number | null;
  onClose: () => void;
}

export function LedgerModal({ userId, onClose }: Props) {
  const { data, isPending } = useBalanceLedger(userId ? { user_id: userId } : undefined);

  return (
    <Modal
      opened={userId != null}
      onClose={onClose}
      title={<Text fw={700}>Leave Account Ledger</Text>}
      size="lg"
    >
      <Stack gap="sm">
        {isPending ? (
          <Text size="sm" c="dimmed">Loading transactions…</Text>
        ) : !data?.results?.length ? (
          <Text size="sm" c="dimmed">No ledger transactions found.</Text>
        ) : (
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date & Time</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Kind</Table.Th>
                <Table.Th>Days</Table.Th>
                <Table.Th>Note</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.results.map((row: any) => (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    <Text size="xs">{new Date(row.at).toLocaleString()}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="xs" variant="outline">
                      {String(row.category).toUpperCase()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" fw={500}>
                      {String(row.kind).replace(/_/g, " ")}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      size="xs"
                      fw={600}
                      c={Number(row.days) > 0 ? "teal" : Number(row.days) < 0 ? "red" : "dark"}
                    >
                      {Number(row.days) > 0 ? `+${row.days}` : row.days}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {row.note || "—"}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>
    </Modal>
  );
}
