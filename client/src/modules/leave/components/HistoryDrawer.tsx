import { Badge, Drawer, Group, Stack, Text, Timeline } from "@mantine/core";

import { ErrorState } from "../../../ui/components/ErrorState";
import { useLeaveHistory } from "../api/hooks";
import type { LeaveEvent } from "../api/types";

export function LeaveHistoryDrawer({
  requestId,
  onClose,
}: {
  requestId: number | null;
  onClose: () => void;
}) {
  const { data, isPending, error } = useLeaveHistory(requestId ?? undefined);

  return (
    <Drawer
      opened={requestId != null}
      onClose={onClose}
      position="right"
      size="md"
      title={<Text fw={700}>Leave Request #{requestId} History</Text>}
    >
      {error && <ErrorState error={error} />}
      {isPending && !error && <Text size="sm" c="dimmed">Loading…</Text>}

      {data && (
        <Stack gap="md">
          {!data.results.length ? (
            <Text size="sm" c="dimmed">No history entries recorded yet.</Text>
          ) : (
            <Timeline active={data.results.length} bulletSize={18} lineWidth={2}>
              {data.results.map((entry: LeaveEvent, i: number) => (
                <Timeline.Item
                  key={`${entry.id}-${i}`}
                  color="blue"
                  title={
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600}>
                        {entry.kind.replace(/_/g, " ")}
                      </Text>
                      {entry.actor_label && (
                        <Badge size="xs" variant="light" color="blue">
                          {entry.actor_label}
                        </Badge>
                      )}
                    </Group>
                  }
                >
                  <Text size="xs" c="dimmed">
                    {entry.at ? new Date(entry.at).toLocaleString() : ""}
                  </Text>
                  {entry.from_status && entry.to_status && (
                    <Text size="xs" fw={500} mt={4}>
                      {entry.from_status} → {entry.to_status}
                    </Text>
                  )}
                  {entry.note && (
                    <Text size="xs" c="dark" mt={2} bg="gray.1" p="xs" style={{ borderRadius: 4 }}>
                      {entry.note}
                    </Text>
                  )}
                </Timeline.Item>
              ))}
            </Timeline>
          )}
        </Stack>
      )}
    </Drawer>
  );
}
