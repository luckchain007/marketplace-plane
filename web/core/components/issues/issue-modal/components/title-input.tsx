"use client";

import React from "react";
import { observer } from "mobx-react";
import { Control, Controller, FieldErrors } from "react-hook-form";
// types
import { TIssue } from "@plane/types";
// ui
import { Input } from "@plane/ui";
// helpers
import { getTabIndex } from "@/helpers/issue-modal.helper";

type TIssueTitleInputProps = {
  control: Control<TIssue>;
  issueTitleRef: React.MutableRefObject<HTMLInputElement | null>;
  errors: FieldErrors<TIssue>;
  handleFormChange: () => void;
};

export const IssueTitleInput: React.FC<TIssueTitleInputProps> = observer((props) => {
  const { control, issueTitleRef, errors, handleFormChange } = props;

  return (
    <>
      <Controller
        control={control}
        name="name"
        rules={{
          required: "Title is required",
          maxLength: {
            value: 255,
            message: "Title should be less than 255 characters",
          },
        }}
        render={({ field: { value, onChange, ref } }) => (
          <Input
            id="name"
            name="name"
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              handleFormChange();
            }}
            ref={issueTitleRef || ref}
            hasError={Boolean(errors.name)}
            placeholder="Title"
            className="w-full text-base"
            tabIndex={getTabIndex("name")}
            autoFocus
          />
        )}
      />
      <span className="text-xs font-medium text-red-500">{errors?.name?.message}</span>
    </>
  );
});
