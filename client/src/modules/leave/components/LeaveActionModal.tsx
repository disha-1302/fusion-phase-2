import { useState } from "react";
import {
  Button,
  Group,
  Modal,
  Radio,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

import { errorMessage } from "../../../lib/http";
import {
  useCancelRequest,
  useEmployeeSearch,
  useExtendRequest,
  useNominateSubstitute,
  useResumeRequest,
  useReviewRequest,
  useReviewResumption,
  useRouteRequest,
  useSanctionRequest,
  useWithdrawRequest,
} from "../api/hooks";
import type { LeaveRequest } from "../api/types";

export type ActionType =
  | "withdraw"
  | "cancel"
  | "extend"
  | "resume"
  | "replace_substitute"
  | "review"
  | "route"
  | "sanction"
  | "review_resumption";

interface Props {
  action: ActionType | null;
  request: LeaveRequest | null;
  onClose: () => void;
}

export function LeaveActionModal({ action, request, onClose }: Props) {
  const withdraw = useWithdrawRequest();
  const cancel = useCancelRequest();
  const extend = useExtendRequest();
  const resume = useResumeRequest();
  const replaceSub = useNominateSubstitute();
  const review = useReviewRequest();
  const route = useRouteRequest();
  const sanction = useSanctionRequest();
  const reviewResumption = useReviewResumption();

  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<string>("approve");
  const [newEndDate, setNewEndDate] = useState("");
  const [actualDate, setActualDate] = useState("");
  const [reference, setReference] = useState("");
  const [subSearch, setSubSearch] = useState("");
  const [subId, setSubId] = useState<string | null>(null);

  const { data: employees } = useEmployeeSearch(subSearch);
  const subOptions = (employees ?? []).map((e) => ({
    value: String(e.user_id),
    label: `${e.display_name} (${e.department || e.kind})`,
  }));

  if (!action || !request) return null;

  const isPending =
    withdraw.isPending ||
    cancel.isPending ||
    extend.isPending ||
    resume.isPending ||
    replaceSub.isPending ||
    review.isPending ||
    route.isPending ||
    sanction.isPending ||
    reviewResumption.isPending;

  const handleExecute = () => {
    const notifySuccess = (msg: string) => {
      notifications.show({ color: "green", title: "Action Complete", message: msg });
      onClose();
    };
    const notifyErr = (err: unknown) => {
      notifications.show({ color: "red", title: "Action Failed", message: errorMessage(err) });
    };

    switch (action) {
      case "withdraw":
        withdraw.mutate(request.id, {
          onSuccess: () => notifySuccess("Leave request has been withdrawn immediately."),
          onError: notifyErr,
        });
        break;

      case "cancel":
        cancel.mutate(
          { id: request.id, payload: { reason: note } },
          {
            onSuccess: () => notifySuccess("Cancellation request submitted."),
            onError: notifyErr,
          }
        );
        break;

      case "extend":
        if (!newEndDate) {
          notifications.show({ color: "red", title: "Validation", message: "Please specify new end date." });
          return;
        }
        extend.mutate(
          {
            id: request.id,
            payload: {
              new_end_date: newEndDate,
              reason: note,
              substitute_user_id: subId ? Number(subId) : null,
            },
          },
          {
            onSuccess: () => notifySuccess("Extension request submitted."),
            onError: notifyErr,
          }
        );
        break;

      case "resume":
        if (!actualDate) {
          notifications.show({ color: "red", title: "Validation", message: "Please specify actual return date." });
          return;
        }
        resume.mutate(
          { id: request.id, payload: { actual_date: actualDate, details: note } },
          {
            onSuccess: () => notifySuccess("Resumption details recorded and submitted for review."),
            onError: notifyErr,
          }
        );
        break;

      case "replace_substitute":
        if (!subId) {
          notifications.show({ color: "red", title: "Validation", message: "Please select a replacement substitute." });
          return;
        }
        replaceSub.mutate(
          { id: request.id, substitute_user_id: Number(subId) },
          {
            onSuccess: () => notifySuccess("Replacement substitute nominated."),
            onError: notifyErr,
          }
        );
        break;

      case "review":
        review.mutate(
          {
            id: request.id,
            payload: {
              outcome: outcome as "approve" | "reject" | "recommended" | "not_recommended",
              note,
              reference,
            },
          },
          {
            onSuccess: () => notifySuccess("Review decision recorded."),
            onError: notifyErr,
          }
        );
        break;

      case "route":
        route.mutate(
          { id: request.id, note },
          {
            onSuccess: () => notifySuccess("File routed to final authority."),
            onError: notifyErr,
          }
        );
        break;

      case "sanction":
        sanction.mutate(
          {
            id: request.id,
            payload: {
              outcome: outcome as "approve" | "reject",
              note,
              reference,
            },
          },
          {
            onSuccess: () => notifySuccess("Sanction decision recorded."),
            onError: notifyErr,
          }
        );
        break;

      case "review_resumption":
        if (!request.pending_resumption) return;
        reviewResumption.mutate(
          { id: request.pending_resumption.id, payload: { note } },
          {
            onSuccess: () => notifySuccess("Resumption review completed and balance adjusted."),
            onError: notifyErr,
          }
        );
        break;
    }
  };

  const titles: Record<ActionType, string> = {
    withdraw: `Withdraw Request #${request.id}`,
    cancel: `Request Cancellation for #${request.id}`,
    extend: `Extend Leave #${request.id}`,
    resume: `Report Resumption for #${request.id}`,
    replace_substitute: `Replace Declined Substitute for #${request.id}`,
    review: `Unit Head Review for #${request.id}`,
    route: `Establishment Route for #${request.id}`,
    sanction: `Final Sanction Decision for #${request.id}`,
    review_resumption: `Review Return / Resumption for #${request.id}`,
  };

  return (
    <Modal opened={true} onClose={onClose} title={<Text fw={700}>{titles[action]}</Text>} size="md">
      <Stack gap="sm">
        {action === "withdraw" && (
          <Text size="sm">
            Are you sure you want to withdraw this pending {request.category.toUpperCase()} leave request? All
            subsequent workflow processing will terminate immediately.
          </Text>
        )}

        {action === "cancel" && (
          <>
            <Text size="sm">
              Request cancellation before the leave starts ({request.start_date}). If approved by the sanctioning
              authority, deducted balance will be restored.
            </Text>
            <Textarea
              label="Cancellation Reason"
              placeholder="State reason for cancelling"
              value={note}
              onChange={(e) => setNote(e.currentTarget.value)}
            />
          </>
        )}

        {action === "extend" && (
          <>
            <Text size="sm">
              Currently approved until {request.end_date}. Provide the new requested end date for incremental posting.
            </Text>
            <TextInput
              label="New Extended End Date"
              type="date"
              required
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.currentTarget.value)}
            />
            <Select
              label="Substitute (Optional coverage)"
              placeholder="Search employee..."
              searchable
              clearable
              searchValue={subSearch}
              onSearchChange={setSubSearch}
              value={subId}
              onChange={setSubId}
              data={subOptions}
            />
            <Textarea
              label="Reason for Extension"
              value={note}
              onChange={(e) => setNote(e.currentTarget.value)}
            />
          </>
        )}

        {action === "resume" && (
          <>
            <Text size="sm">
              Approved leave period ends on {request.end_date}. Enter the actual date you resumed / return to duty.
            </Text>
            <TextInput
              label="Actual Return / Resumption Date"
              type="date"
              required
              value={actualDate}
              onChange={(e) => setActualDate(e.currentTarget.value)}
            />
            <Textarea
              label="Remarks / Joining Details"
              value={note}
              onChange={(e) => setNote(e.currentTarget.value)}
            />
          </>
        )}

        {action === "replace_substitute" && (
          <>
            <Text size="sm">
              The previously nominated substitute declined. Select a new employee to take responsibility coverage.
            </Text>
            <Select
              label="Select Replacement Substitute"
              placeholder="Search employee..."
              searchable
              required
              searchValue={subSearch}
              onSearchChange={setSubSearch}
              value={subId}
              onChange={setSubId}
              data={subOptions}
            />
          </>
        )}

        {action === "review" && (
          <>
            <Text size="sm" fw={500}>
              Applicant: {request.applicant_name} ({request.category.toUpperCase()}: {request.start_date} to{" "}
              {request.end_date})
            </Text>
            {request.category === "cl" || request.category === "rh" ? (
              <Radio.Group label="Final Decision" value={outcome} onChange={setOutcome}>
                <Group mt="xs">
                  <Radio value="approve" label="Approve" color="green" />
                  <Radio value="reject" label="Reject" color="red" />
                </Group>
              </Radio.Group>
            ) : (
              <Radio.Group label="Recommendation (Higher Sanction)" value={outcome} onChange={setOutcome}>
                <Group mt="xs">
                  <Radio value="recommended" label="Recommended" color="blue" />
                  <Radio value="not_recommended" label="Not Recommended" color="orange" />
                </Group>
              </Radio.Group>
            )}
            <TextInput
              label="Sanction / Order Reference (Optional)"
              value={reference}
              onChange={(e) => setReference(e.currentTarget.value)}
            />
            <Textarea
              label="Review Note"
              placeholder="Comments or notes"
              value={note}
              onChange={(e) => setNote(e.currentTarget.value)}
            />
          </>
        )}

        {action === "route" && (
          <>
            <Text size="sm">
              Verify establishment details and forward request to the competent Sanctioning Authority.
            </Text>
            <Textarea
              label="Routing Note (Optional)"
              value={note}
              onChange={(e) => setNote(e.currentTarget.value)}
            />
          </>
        )}

        {action === "sanction" && (
          <>
            <Text size="sm" fw={500}>
              Final Decision for {request.applicant_name} ({request.category.toUpperCase()}: {request.start_date} to{" "}
              {request.end_date})
            </Text>
            <Radio.Group label="Decision" value={outcome} onChange={setOutcome}>
              <Group mt="xs">
                <Radio value="approve" label="Approve" color="green" />
                <Radio value="reject" label="Reject" color="red" />
              </Group>
            </Radio.Group>
            <TextInput
              label="Order Reference / Sanction File Number"
              value={reference}
              onChange={(e) => setReference(e.currentTarget.value)}
            />
            <Textarea
              label="Decision Note"
              placeholder="Sanctioning notes"
              value={note}
              onChange={(e) => setNote(e.currentTarget.value)}
            />
          </>
        )}

        {action === "review_resumption" && (
          <>
            <Text size="sm">
              Actual return date reported: {request.pending_resumption?.actual_date} (approved end date:{" "}
              {request.pending_resumption?.approved_end_date}).
            </Text>
            <Textarea
              label="Review Note"
              value={note}
              onChange={(e) => setNote(e.currentTarget.value)}
            />
          </>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleExecute} loading={isPending} color={action === "withdraw" ? "red" : "blue"}>
            Confirm
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
