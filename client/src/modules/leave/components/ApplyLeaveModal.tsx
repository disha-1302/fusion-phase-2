import { useState } from "react";
import {
  Button,
  Checkbox,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

import { errorMessage } from "../../../lib/http";
import { useEmployeeSearch, useSubmitLeave } from "../api/hooks";
import type { LeaveCategory, SubmitLeaveRequest } from "../api/types";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function ApplyLeaveModal({ opened, onClose }: Props) {
  const submit = useSubmitLeave();
  const [category, setCategory] = useState<LeaveCategory>("cl");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [halfDay, setHalfDay] = useState<string>("none");
  const [purpose, setPurpose] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [stationLeave, setStationLeave] = useState(false);
  const [stationPlace, setStationPlace] = useState("");
  const [stationReason, setStationReason] = useState("");
  const [substituteSearch, setSubstituteSearch] = useState("");
  const [substituteId, setSubstituteId] = useState<string | null>(null);

  const { data: employees } = useEmployeeSearch(substituteSearch);

  const substituteOptions = (employees ?? []).map((e) => ({
    value: String(e.user_id),
    label: `${e.display_name} (${e.department || e.kind})`,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      notifications.show({ color: "red", title: "Error", message: "Please specify start and end dates." });
      return;
    }

    const payload: SubmitLeaveRequest = {
      category,
      start_date: startDate,
      end_date: endDate,
      half_day: category === "cl" ? halfDay : "none",
      purpose,
      evidence_note: evidenceNote,
      station_leave: stationLeave,
      station_place: stationLeave ? stationPlace : "",
      station_reason: stationLeave ? stationReason : "",
      substitute_user_id: substituteId ? Number(substituteId) : null,
    };

    submit.mutate(payload, {
      onSuccess: () => {
        notifications.show({
          color: "green",
          title: "Leave Submitted",
          message: `Leave application for ${category.toUpperCase()} has been submitted.`,
        });
        onClose();
      },
      onError: (err) => {
        notifications.show({
          color: "red",
          title: "Application Refused",
          message: errorMessage(err),
        });
      },
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700}>Apply for Leave</Text>} size="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Select
            label="Leave Category"
            required
            value={category}
            onChange={(v) => setCategory((v as LeaveCategory) || "cl")}
            data={[
              { value: "cl", label: "Casual Leave (CL)" },
              { value: "rh", label: "Restricted Holiday (RH)" },
              { value: "scl", label: "Special Casual Leave (SCL)" },
              { value: "el", label: "Earned Leave (EL)" },
              { value: "col", label: "Commuted Leave (COL)" },
              { value: "vl", label: "Vacation Leave (VL)" },
            ]}
          />

          <Group grow>
            <TextInput
              label="Start Date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.currentTarget.value)}
            />
            <TextInput
              label="End Date"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.currentTarget.value)}
            />
          </Group>

          {category === "cl" && (
            <Select
              label="Half-Day Option"
              value={halfDay}
              onChange={(v) => setHalfDay(v || "none")}
              data={[
                { value: "none", label: "Full day" },
                { value: "first", label: "First Half (0.5 day)" },
                { value: "second", label: "Second Half (0.5 day)" },
              ]}
            />
          )}

          <Select
            label="Nominate Substitute (Responsibility Coverage)"
            placeholder="Type to search employees..."
            searchable
            clearable
            searchValue={substituteSearch}
            onSearchChange={setSubstituteSearch}
            value={substituteId}
            onChange={setSubstituteId}
            data={substituteOptions}
          />

          <Textarea
            label="Purpose / Reason"
            placeholder="Reason for taking leave"
            value={purpose}
            onChange={(e) => setPurpose(e.currentTarget.value)}
          />

          {(category === "scl" || category === "col") && (
            <TextInput
              label="Supporting Evidence / Medical Reference"
              placeholder="Certificate or reference note"
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.currentTarget.value)}
            />
          )}

          <Checkbox
            label="Station Leave (leaving Jabalpur)"
            checked={stationLeave}
            onChange={(e) => setStationLeave(e.currentTarget.checked)}
            mt="xs"
          />

          {stationLeave && (
            <Group grow>
              <TextInput
                label="Destination Place"
                placeholder="City / State"
                required={stationLeave}
                value={stationPlace}
                onChange={(e) => setStationPlace(e.currentTarget.value)}
              />
              <TextInput
                label="Station Leave Reason"
                placeholder="Reason for travel"
                required={stationLeave}
                value={stationReason}
                onChange={(e) => setStationReason(e.currentTarget.value)}
              />
            </Group>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={submit.isPending}>
              Submit Application
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
