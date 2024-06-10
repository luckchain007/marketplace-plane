import { FC, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ChevronLeft } from "lucide-react";
import { IEstimateFormData, TEstimateSystemKeys, TEstimatePointsObject } from "@plane/types";
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
import { EstimateCreateStageOne, EstimatePointCreateRoot } from "@/components/estimates";
// constants
import { EEstimateSystem, ESTIMATE_SYSTEMS } from "@/constants/estimates";
// hooks
import { useProjectEstimates } from "@/hooks/store";

type TCreateEstimateModal = {
  workspaceSlug: string;
  projectId: string;
  isOpen: boolean;
  handleClose: () => void;
};

export const CreateEstimateModal: FC<TCreateEstimateModal> = observer((props) => {
  // props
  const { workspaceSlug, projectId, isOpen, handleClose } = props;
  // hooks
  const { createEstimate } = useProjectEstimates();
  // states
  const [estimateSystem, setEstimateSystem] = useState<TEstimateSystemKeys>(EEstimateSystem.POINTS);
  const [estimatePoints, setEstimatePoints] = useState<TEstimatePointsObject[] | undefined>(undefined);
  const [buttonLoader, setButtonLoader] = useState(false);

  const handleUpdatePoints = (newPoints: TEstimatePointsObject[] | undefined) => setEstimatePoints(newPoints);

  useEffect(() => {
    if (isOpen) {
      setEstimateSystem(EEstimateSystem.POINTS);
      setEstimatePoints(undefined);
    }
  }, [isOpen]);

  const handleCreateEstimate = async () => {
    try {
      if (!workspaceSlug || !projectId || !estimatePoints) return;
      setButtonLoader(true);
      const payload: IEstimateFormData = {
        estimate: {
          name: ESTIMATE_SYSTEMS[estimateSystem]?.name,
          type: estimateSystem,
          last_used: true,
        },
        estimate_points: estimatePoints,
      };
      await createEstimate(workspaceSlug, projectId, payload);

      setButtonLoader(false);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Estimate created",
        message: "A new estimate has been added in your project.",
      });
      handleClose();
    } catch (error) {
      setButtonLoader(false);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Estimate creation failed",
        message: "We were unable to create the new estimate, please try again.",
      });
    }
  };

  // derived values
  const renderEstimateStepsCount = useMemo(() => (estimatePoints ? "2" : "1"), [estimatePoints]);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="relative space-y-6 py-5">
        {/* heading */}
        <div className="relative flex justify-between items-center gap-2 px-5">
          <div className="relative flex items-center gap-1">
            {estimatePoints && (
              <div
                onClick={() => {
                  setEstimateSystem(EEstimateSystem.POINTS);
                  handleUpdatePoints(undefined);
                }}
                className="flex-shrink-0 cursor-pointer w-5 h-5 flex justify-center items-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </div>
            )}
            <div className="text-xl font-medium text-custom-text-100">New Estimate System</div>
          </div>
          <div className="text-xs text-gray-400">Step {renderEstimateStepsCount} of 2</div>
        </div>

        {/* estimate steps */}
        <div className="px-5">
          {!estimatePoints && (
            <EstimateCreateStageOne
              estimateSystem={estimateSystem}
              handleEstimateSystem={setEstimateSystem}
              handleEstimatePoints={(templateType: string) =>
                handleUpdatePoints(ESTIMATE_SYSTEMS[estimateSystem].templates[templateType].values)
              }
            />
          )}
          {estimatePoints && (
            <>
              <EstimatePointCreateRoot
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                estimateId={undefined}
                estimateType={estimateSystem}
                estimatePoints={estimatePoints}
                setEstimatePoints={setEstimatePoints}
              />
            </>
          )}
        </div>

        <div className="relative flex justify-end items-center gap-3 px-5 pt-5 border-t border-custom-border-200">
          <Button variant="neutral-primary" size="sm" onClick={handleClose} disabled={buttonLoader}>
            Cancel
          </Button>
          {estimatePoints && (
            <Button variant="primary" size="sm" onClick={handleCreateEstimate} disabled={buttonLoader}>
              {buttonLoader ? `Creating` : `Create Estimate`}
            </Button>
          )}
        </div>
      </div>
    </ModalCore>
  );
});
