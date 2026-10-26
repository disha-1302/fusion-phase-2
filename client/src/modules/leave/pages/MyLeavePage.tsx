import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { FaHistory, FaPlus } from "react-icons/fa";

import { DataTable } from "../../../ui/components/DataTable";
import { ErrorState } from "../../../ui/components/ErrorState";
import { PageHeader } from "../../../ui/components/PageHeader";
import { StatusBadge } from "../../../ui/components/StatusBadge";
import { useLeaveRequests } from "../api/hooks";
import type { LeaveRequest } from "../api/types";
import { ApplyLeaveModal } from "../components/ApplyLeaveModal";
import { LeaveHistoryDrawer } from "../components/HistoryDrawer";
import { type ActionType, LeaveActionModal } from "../components/LeaveActionModal";

export default function MyLeavePage() {
  const { data, isPending, error } = useLeaveRequests();
  const [applyOpened, setApplyOpened] = useState(false);
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  if (error) {
    return (
      <Container size="xl">
        <ErrorState error={error} />
      </Container>
    );
  }

  const triggerAction = (req: LeaveRequest, act: ActionType) => {
    setSelectedRequest(req);
    setActiveAction(act);
  };

  return (
    <Container size="xl">
      <PageHeader
        title="My Leave"
        subtitle="Manage your leave requests, check approval stages, and view history"
        action={
          <Button leftSection={<FaPlus />} onClick={() => setApplyOpened(true)}>
            Apply for Leave
          </Button>
        }
      />

      <Card padding="lg" withBorder>
        <DataTable<LeaveRequest>
          rows={(data?.results ?? []) as LeaveRequest[]}
          loading={isPending}
          rowKey={(r) => r.id}
          minWidth={900}
          empty={{
            title: "No leave applications",
            description: "You have not submitted any leave requests yet.",
          }}
          columns={[
            {
              key: "category",
              header: "Category",
              render: (r) => (
                <Stack gap={2}>
                  <Group gap="xs">
                    <Badge variant="filled" color="indigo">
                      {r.category.toUpperCase()}
                    </Badge>
                    {r.kind !== "new" && (
                      <Badge size="xs" variant="light" color="gray">
                        {r.kind}
                      </Badge>
                    )}
                  </Group>
                  <Text size="xs" c="dimmed">
                    #{r.id} {r.station_leave ? "• Station Leave" : ""}
                  </Text>
                </Stack>
              ),
            },
            {
              key: "dates",
              header: "Period",
              render: (r) => (
                <Stack gap={0}>
                  <Text size="sm" fw={500}>
                    {r.start_date} → {r.end_date}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {r.chargeable_days} chargeable day(s){" "}
                    {r.half_day !== "none" ? `(${r.half_day} half)` : ""}
                  </Text>
                </Stack>
              ),
            },
            {
              key: "substitute",
              header: "Substitute",
              render: (r) =>
                r.substitute_user_id ? (
                  <Stack gap={0}>
                    <Text size="sm">{r.substitute_name || `#${r.substitute_user_id}`}</Text>
                    <Badge
                      size="xs"
                      variant="dot"
                      color={
                        r.substitute_status === "accepted"
                          ? "green"
                          : r.substitute_status === "declined"
                          ? "red"
                          : "yellow"
                      }
                    >
                      {r.substitute_status}
                    </Badge>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    None
                  </Text>
                ),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusBadge status={r.status} />,
            },
            {
              key: "actions",
              header: "",
              align: "right",
              render: (r) => (
                <Group justify="flex-end" gap="xs">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label="History"
                    onClick={() => setHistoryId(r.id)}
                  >
                    <FaHistory size={14} />
                  </ActionIcon>

                  {r.allowed_actions?.includes("withdraw") && (
                    <Button
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={() => triggerAction(r, "withdraw")}
                    >
                      Withdraw
                    </Button>
                  )}

                  {r.allowed_actions?.includes("cancel") && (
                    <Button
                      size="xs"
                      variant="subtle"
                      color="orange"
                      onClick={() => triggerAction(r, "cancel")}
                    >
                      Cancel
                    </Button>
                  )}

                  {r.allowed_actions?.includes("extend") && (
                    <Button
                      size="xs"
                      variant="subtle"
                      color="teal"
                      onClick={() => triggerAction(r, "extend")}
                    >
                      Extend
                    </Button>
                  )}

                  {r.allowed_actions?.includes("resume") && (
                    <Button
                      size="xs"
                      variant="light"
                      color="blue"
                      onClick={() => triggerAction(r, "resume")}
                    >
                      Report Return
                    </Button>
                  )}

                  {r.allowed_actions?.includes("substitute") && (
                    <Button
                      size="xs"
                      variant="light"
                      color="violet"
                      onClick={() => triggerAction(r, "replace_substitute")}
                    >
                      Replace Substitute
                    </Button>
                  )}
                </Group>
              ),
            },
          ]}
        />
      </Card>

      <ApplyLeaveModal opened={applyOpened} onClose={() => setApplyOpened(false)} />

      <LeaveHistoryDrawer requestId={historyId} onClose={() => setHistoryId(null)} />

      <LeaveActionModal
        action={activeAction}
        request={selectedRequest}
        onClose={() => {
          setActiveAction(null);
          setSelectedRequest(null);
        }}
      />
    </Container>
  );
}
