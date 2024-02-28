import { useEffect, useRef, useState } from "react";
import { Combobox } from "@headlessui/react";
import { observer } from "mobx-react";
//components
import { Avatar } from "@plane/ui";
//store
import { useApplication, useMember, useUser } from "hooks/store";
//hooks
import { usePopper } from "react-popper";
//icon
import { Check, Search } from "lucide-react";
//types
import { Placement } from "@popperjs/core";

interface Props {
  projectId?: string;
  referenceElement: HTMLButtonElement | null;
  placement: Placement | undefined;
  isOpen: boolean;
}

export const MemberOptions = observer((props: Props) => {
  const { projectId, referenceElement, placement, isOpen } = props;

  const [query, setQuery] = useState("");
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // store hooks
  const {
    router: { workspaceSlug },
  } = useApplication();
  const {
    getUserDetails,
    project: { getProjectMemberIds, fetchProjectMembers },
    workspace: { workspaceMemberIds },
  } = useMember();
  const { currentUser } = useUser();

  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  useEffect(() => {
    if (isOpen) {
      onOpen();
      inputRef.current && inputRef.current.focus();
    }
  }, [isOpen]);

  const memberIds = projectId ? getProjectMemberIds(projectId) : workspaceMemberIds;
  const onOpen = () => {
    if (!memberIds && workspaceSlug && projectId) fetchProjectMembers(workspaceSlug, projectId);
  };

  const searchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (query !== "" && e.key === "Escape") {
      e.stopPropagation();
      setQuery("");
    }
  };

  const options = memberIds?.map((userId) => {
    const userDetails = getUserDetails(userId);

    return {
      value: userId,
      query: `${userDetails?.display_name} ${userDetails?.first_name} ${userDetails?.last_name}`,
      content: (
        <div className="flex items-center gap-2">
          <Avatar name={userDetails?.display_name} src={userDetails?.avatar} />
          <span className="flex-grow truncate">{currentUser?.id === userId ? "You" : userDetails?.display_name}</span>
        </div>
      ),
    };
  });

  const filteredOptions =
    query === "" ? options : options?.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  return (
    <Combobox.Options className="fixed z-10" static>
      <div
        className="my-1 w-48 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none"
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
      >
        <div className="flex items-center gap-1.5 rounded border border-custom-border-100 bg-custom-background-90 px-2">
          <Search className="h-3.5 w-3.5 text-custom-text-400" strokeWidth={1.5} />
          <Combobox.Input
            as="input"
            ref={inputRef}
            className="w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            displayValue={(assigned: any) => assigned?.name}
            onKeyDown={searchInputKeyDown}
          />
        </div>
        <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
          {filteredOptions ? (
            filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <Combobox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active, selected }) =>
                    `w-full truncate flex items-center justify-between gap-2 rounded px-1 py-1.5 cursor-pointer select-none ${
                      active ? "bg-custom-background-80" : ""
                    } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className="flex-grow truncate">{option.content}</span>
                      {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                    </>
                  )}
                </Combobox.Option>
              ))
            ) : (
              <p className="text-custom-text-400 italic py-1 px-1.5">No matching results</p>
            )
          ) : (
            <p className="text-custom-text-400 italic py-1 px-1.5">Loading...</p>
          )}
        </div>
      </div>
    </Combobox.Options>
  );
});
