import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { ReviewReplyData, ReviewReplySchema } from "../types/review.schema";
import { ReviewReply } from "../types/review";

interface ReviewReplyFormProps {
  replyToEdit?: ReviewReply | null;
  isSubmitting: boolean;
  onSave: (data: ReviewReplyData) => void;
  onCancel: () => void;
}

export const ReviewReplyForm: React.FC<ReviewReplyFormProps> = ({
  replyToEdit,
  isSubmitting,
  onSave,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewReplyData>({
    resolver: zodResolver(ReviewReplySchema),
    defaultValues: {
      content: "",
    },
  });

  useEffect(() => {
    reset({
      content: replyToEdit?.content || "",
    });
  }, [replyToEdit, reset]);

  const isEditMode = !!replyToEdit;

  return (
    <div className="bg-white dark:bg-white/[0.03] p-5 rounded-xl border border-gray-200 dark:border-white/[0.05] shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex flex-col gap-1 mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-white/90">
          {isEditMode ? "Edit Staff Reply" : "Add Staff Reply"}
        </h3>
        <p className="text-sm text-gray-500">
          {isEditMode ? "Update your previous response." : "Share your feedback with the customer."}
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSave)}>
        <div>
          <Label className="text-sm mb-1.5">Reply Content</Label>
          <TextArea
            placeholder="Type your reply here..."
            rows={4}
            error={!!errors.content}
            hint={errors.content?.message}
            disabled={isSubmitting}
            {...register("content")}
          />
        </div>

        <div className="flex items-center gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditMode ? "Update Reply" : "Submit Reply"}
          </Button>
        </div>
      </form>
    </div>
  );
};
