import React from "react";

// hooks
import useEstimateOption from "hooks/use-estimate-option";
// ui
import { CustomSelect } from "components/ui";
// icons
import { PlayIcon } from "@heroicons/react/24/outline";
// types
import { UserAuth } from "types";

type Props = {
  value: number | null;
  onChange: (val: number | null) => void;
  userAuth: UserAuth;
  disabled?: boolean;
};

export const SidebarEstimateSelect: React.FC<Props> = ({
  value,
  onChange,
  userAuth,
  disabled = false,
}) => {
  const isNotAllowed = userAuth.isGuest || userAuth.isViewer || disabled;

  const { isEstimateActive, estimatePoints } = useEstimateOption();

  if (!isEstimateActive) return null;

  return (
    <div className="flex flex-wrap items-center py-2">
      <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
        <PlayIcon className="h-4 w-4 flex-shrink-0 -rotate-90" />
        <p>Estimate</p>
      </div>
      <div className="sm:basis-1/2">
        <CustomSelect
          value={value}
          label={
            <div className="flex items-center gap-2 text-xs">
              <PlayIcon
                className={`h-4 w-4 -rotate-90 ${
                  value !== null ? "text-custom-text-100" : "text-custom-text-200"
                }`}
              />
              {estimatePoints?.find((e) => e.key === value)?.value ?? (
                <span className="text-custom-text-200">No estimates</span>
              )}
            </div>
          }
          onChange={onChange}
          position="right"
          width="w-full"
          disabled={isNotAllowed || disabled}
        >
          <CustomSelect.Option value={null}>
            <>
              <span>
                <PlayIcon className="h-4 w-4 -rotate-90" />
              </span>
              None
            </>
          </CustomSelect.Option>
          {estimatePoints &&
            estimatePoints.map((point) => (
              <CustomSelect.Option key={point.key} value={point.key}>
                <>
                  <span>
                    <PlayIcon className="h-4 w-4 -rotate-90" />
                  </span>
                  {point.value}
                </>
              </CustomSelect.Option>
            ))}
        </CustomSelect>
      </div>
    </div>
  );
};
