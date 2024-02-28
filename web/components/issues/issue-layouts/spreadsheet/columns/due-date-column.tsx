import React from "react";
import { observer } from "mobx-react-lite";
import { CalendarCheck2 } from "lucide-react";
// hooks
import { useProjectState } from "hooks/store";
// components
import { DateDropdown } from "components/dropdowns";
// helpers
import { renderFormattedPayloadDate } from "helpers/date-time.helper";
import { shouldHighlightIssueDueDate } from "helpers/issue.helper";
import { cn } from "helpers/common.helper";
// types
import { TIssue } from "@plane/types";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: any) => void;
  disabled: boolean;
};

export const SpreadsheetDueDateColumn: React.FC<Props> = observer((props: Props) => {
  const { issue, onChange, disabled, onClose } = props;
  // store hooks
  const { getStateById } = useProjectState();
  // derived values
  const stateDetails = getStateById(issue.state_id);

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <DateDropdown
        value={issue.target_date}
        minDate={issue.start_date ? new Date(issue.start_date) : undefined}
        onChange={(data) => {
          const targetDate = data ? renderFormattedPayloadDate(data) : null;
          onChange(
            issue,
            { target_date: targetDate },
            {
              changed_property: "target_date",
              change_details: targetDate,
            }
          );
        }}
        disabled={disabled}
        placeholder="Due date"
        icon={<CalendarCheck2 className="h-3 w-3 flex-shrink-0" />}
        buttonVariant="transparent-with-text"
        buttonContainerClassName="w-full"
        buttonClassName={cn("rounded-none text-left", {
          "text-red-500": shouldHighlightIssueDueDate(issue.target_date, stateDetails?.group),
        })}
        clearIconClassName="!text-custom-text-100"
        onClose={onClose}
      />
    </div>
  );
});
