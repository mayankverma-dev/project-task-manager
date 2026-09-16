import { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { X, Loader2, Building2 } from "lucide-react";
import { useCreateWorkspace } from "../hooks/useWorkspaces.js";
import { setActiveWorkspace } from "../workspaceSlice.js";

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be at most 60 characters"),
});

/**
 * Modal dialog for creating a new workspace.
 *
 * @param {{ isOpen: boolean, onClose: () => void }} props
 */
export const CreateWorkspaceModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const createWorkspaceMutation = useCreateWorkspace();
  const overlayRef = useRef(null);
  const firstInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: "" },
  });

  // Merge react-hook-form's ref with our firstInputRef for auto-focus
  const { ref: registerRef, ...restRegister } = register("name");
  const mergedRef = useCallback(
    (el) => {
      registerRef(el);
      firstInputRef.current = el;
    },
    [registerRef]
  );

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    } else {
      reset();
    }
  }, [isOpen, reset]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const onSubmit = async (data) => {
    try {
      const workspace = await createWorkspaceMutation.mutateAsync(data);
      dispatch(setActiveWorkspace(workspace));
      toast.success(`Workspace "${workspace.name}" created!`);
      onClose();
      reset();
    } catch (error) {
      toast.error(
        error?.response?.data?.error?.message || "Failed to create workspace"
      );
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-workspace-title"
    >
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2
              id="create-workspace-title"
              className="text-lg font-semibold text-gray-900"
            >
              Create Workspace
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div>
            <label
              htmlFor="workspace-name"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Workspace Name
            </label>
            <input
              id="workspace-name"
              type="text"
              autoComplete="organization"
              placeholder="e.g. Acme Corp"
              {...restRegister}
              ref={mergedRef}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg shadow-sm placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name
                  ? "border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400"
                  : "border-gray-300 bg-white"
              }`}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.name.message}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500">
              Your workspace will be a shared environment for your team&apos;s projects.
            </p>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={createWorkspaceMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createWorkspaceMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {createWorkspaceMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Workspace"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
