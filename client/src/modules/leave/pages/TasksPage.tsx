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
import { notifications } from "@mantine/notifications";
import { FaCheck, FaHistory, FaTimes } from "react-icons/fa";

import { errorMessage } from "../../../lib/http";
import { DataTable } from "../../../ui/components/DataTable";
import { ErrorState } from "../../../ui/components/ErrorState";
import { PageHeader } from "../../../ui/components/PageHeader";
import { StatusBadge } from "../../../ui/components/StatusBadge";
import { useLeaveTasks, useSubstituteRespond } from "../api/hooks";
import type { LeaveRequest } from "../api/types";
import { LeaveHistoryDrawer } from "../components/HistoryDrawer";
import { type ActionType, LeaveActionModal } from "../components/LeaveActionModal";

export default function TasksPage() {
  const { data, isPending, error } = useLeaveTasks();
  const subRespond = useSubstituteRespond();
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

  const tasks = (data?.results ?? []) as LeaveRequest[];

  const handleSubRespond = (req: LeaveRequest, resp: "accept" | "decline") => {
    subRespond.mutate(
      { id: req.id, payload: { response: resp } },
      {
        onSuccess: () =>
          notifications.show({
            color: resp === "accept" ? "green" : "orange",
            title: "Response Recorded",
            message: `You ${resp}ed substitute responsibility for request #${req.id}.`,
          }),
        onError: (err) =>
          notifications.show({
            color: "red",
            title: "Failed to respond",
            message: errorMessage(err),
          }),
      }
    );
  };

  const triggerAction = (req: LeaveRequest, act: ActionType) => {
    setSelectedRequest(req);
    setActiveAction(act);
  };

  return (
    <Container size="xl">
      <PageHeader
        title="Leave Tasks"
        subtitle="Actionable workflow items requiring your substitute consent, review, or sanction"
      />

      <Card padding="lg" withBorder>
        <DataTable<LeaveRequest>
          rows={tasks}
          loading={isPending}
          rowKey={(r) => r.id}
          minWidth={900}
          empty={{
            title: "No pending leave tasks",
            description: "You have no actionable substitute or review tasks waiting on you.",
          }}
          columns={[
            {
              key: "applicant",
              header: "Applicant",
              render: (r) => (
                <Stack gap={2}>
                  <Text size="sm" fw={600}>
                    {r.applicant_name || `Employee #${r.user_id}`}
                  </Text>
                  <Group gap="xs">
                    <Badge size="xs" variant="filled" color="indigo">
                      {r.category.toUpperCase()}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      #{r.id} {r.kind !== "new" ? `(${r.kind})` : ""}
                    </Text>
                  </Group>
                </Stack>
              ),
            },
            {
              key: "period",
              header: "Leave Period",
              render: (r) => (
                <Stack gap={0}>
                  <Text size="sm">
                    {r.start_date} → {r.end_date}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {r.chargeable_days} chargeable day(s)
                  </Text>
                </Stack>
              ),
            },
            {
              key: "task",
              header: "Task",
              render: (r) => (
                <Stack gap={2}>
                  <Badge variant="outline" color="blue">
                    {r.task_class ? r.task_class.replace(/_/g, " ") : "Action Required"}
                  </Badge>
                  {r.task_assigned_at && (
                    <Text size="xs" c="dimmed">
                      Assigned: {new Date(r.task_assigned_at).toLocaleDateString()}
                    </Text>
                  )}
                </Stack>
              ),
            },
            {
              key: "status",
              header: "Current State",
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

                  {/* Substitute Consent */}
                  {r.allowed_actions?.includes("respond_substitute") && (
                    <>
                      <Button
                        size="xs"
                        color="green"
                        leftSection={<FaCheck size={12} />}
                        loading={subRespond.isPending}
                        onClick={() => handleSubRespond(r, "accept")}
                      >
                        Accept
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="subtle"
                        leftSection={<FaTimes size={12} />}
                        loading={subRespond.isPending}
                        onClick={() => handleSubRespond(r, "decline")}
                      >
                        Decline
                      </Button>
                    </>
                  )}

                  {/* Unit Head Review */}
                  {r.allowed_actions?.includes("review") && (
                    <Button
                      size="xs"
                      color="blue"
                      onClick={() => triggerAction(r, "review")}
                    >
                      Review
                    </Button>
                  )}

                  {/* Establishment Route */}
                  {r.allowed_actions?.includes("route") && (
                    <Button
                      size="xs"
                      color="cyan"
                      onClick={() => triggerAction(r, "route")}
                    >
                      Route File
                    </Button>
                  )}

                  {/* Sanction */}
                  {r.allowed_actions?.includes("sanction") && (
                    <Button
                      size="xs"
                      color="teal"
                      onClick={() => triggerAction(r, "sanction")}
                    >
                      Sanction
                    </Button>
                  )}

                  {/* Resumption Review */}
                  {r.allowed_actions?.includes("review_resumption") && (
                    <Button
                      size="xs"
                      color="indigo"
                      onClick={() => triggerAction(r, "review_resumption")}
                    >
                      Review Resumption
                    </Button>
                  )}
                </Group>
              ),
            },
          ]}
        />
      </Card>

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
