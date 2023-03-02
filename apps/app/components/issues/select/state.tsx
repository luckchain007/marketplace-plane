import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import stateService from "services/state.service";
// headless ui
import {
  Squares2X2Icon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
// icons
import { Combobox, Transition } from "@headlessui/react";
// helpers
import { getStatesList } from "helpers/state.helper";
// fetch keys
import { STATE_LIST } from "constants/fetch-keys";
import { getStateGroupIcon } from "components/icons";

type Props = {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  onChange: (value: string) => void;
  projectId: string;
};

export const IssueStateSelect: React.FC<Props> = ({ setIsOpen, value, onChange, projectId }) => {
  // states
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: stateGroups } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId)
      : null
  );
  const states = getStatesList(stateGroups ?? {});

  const options = states?.map((state) => ({
    value: state.id,
    display: state.name,
    color: state.color,
    group: state.group,
  }));

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.display.toLowerCase().includes(query.toLowerCase()));

  const currentOption = options?.find((option) => option.value === value);
  return (
    <Combobox
      as="div"
      value={value}
      onChange={(val: any) => onChange(val)}
      className="relative flex-shrink-0"
    >
      {({ open }: any) => (
        <>
          <Combobox.Button
            className={({ open }) =>
              `flex items-center text-xs cursor-pointer border rounded-md shadow-sm duration-300 
            ${
              open
                ? "outline-none border-[#3F76FF] bg-[rgba(63,118,255,0.05)] ring-1 ring-[#3F76FF] "
                : "hover:bg-[rgba(63,118,255,0.05)] focus:bg-[rgba(63,118,255,0.05)]"
            }`
            }
          >
            {value && value !== "" ? (
              <span className="flex items-center justify-center text-xs gap-2 px-3 py-1.5">
                {currentOption && currentOption.group
                  ? getStateGroupIcon(currentOption.group, "16", "16", currentOption.color)
                  : ""}
                <span className=" text-[#495057]">{currentOption?.display}</span>
              </span>
            ) : (
              <span className="flex items-center justify-center  text-xs  gap-2  px-3 py-1.5">
                <Squares2X2Icon className="h-4 w-4 text-gray-500 " />
                <span className=" text-[#858E96]">{currentOption?.display || "State"}</span>
              </span>
            )}
          </Combobox.Button>

          <Transition
            show={open}
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Combobox.Options
              className={`absolute z-10 max-h-52 min-w-[8rem] mt-1 px-2 py-2 text-xs 
              rounded-md shadow-md overflow-auto border-none bg-white focus:outline-none`}
            >
              <div className="flex justify-start items-center rounded-sm border-[0.6px] bg-[#FAFAFA] border-[#E2E2E2] w-full px-2">
                <MagnifyingGlassIcon className="h-3 w-3 text-gray-500" />
                <Combobox.Input
                  className="w-full  bg-transparent py-1 px-2  text-xs text-[#888888] focus:outline-none"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search States"
                  displayValue={(assigned: any) => assigned?.name}
                />
              </div>
              <div className="py-1.5">
                {filteredOptions ? (
                  filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <Combobox.Option
                        key={option.value}
                        className={({ active }) =>
                          `${
                            active ? "bg-[#E9ECEF]" : ""
                          } group flex min-w-[14rem] cursor-pointer select-none items-center gap-2 truncate rounded px-1 py-1.5 text-[#495057]`
                        }
                        value={option.value}
                      >
                        {({ selected, active }) =>
                          states && (
                            <div className="flex w-full gap-2 justify-between rounded">
                              <div className="flex justify-start items-center gap-2">
                                {getStateGroupIcon(option.group, "16", "16", option.color)}
                                <span>{option.display}</span>
                              </div>
                              <div className="flex justify-center items-center p-1 rounded">
                                <CheckIcon
                                  className={`h-3 w-3 ${selected ? "opacity-100" : "opacity-0"}`}
                                />
                              </div>
                            </div>
                          )
                        }
                      </Combobox.Option>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 px-2">No states found</p>
                  )
                ) : (
                  <p className="text-xs text-gray-500 px-2">Loading...</p>
                )}
                <button
                  type="button"
                  className="flex select-none w-full items-center py-2 px-1 rounded hover:bg-[#E9ECEF]"
                  onClick={() => setIsOpen(true)}
                >
                  <span className="flex justify-start items-center gap-1">
                    <PlusIcon className="h-4 w-4 text-[#495057]" aria-hidden="true" />
                    <span className="text-[#495057]">Create New State</span>
                  </span>
                </button>
              </div>
            </Combobox.Options>
          </Transition>
        </>
      )}
    </Combobox>
  );
};
