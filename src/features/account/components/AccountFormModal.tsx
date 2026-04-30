import React, { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import Button from "../../../components/ui/button/Button";
import { Account, AccountFormData } from "../types/account";

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: AccountFormData) => void;
  initialData?: Account | null; // The account to edit, if any
}

const getInitialFormData = (initialData?: Account | null): AccountFormData => {
  if (initialData) {
    return {
      name: initialData.user.name,
      email: initialData.user.email,
      role: initialData.role,
      status: initialData.status,
    };
  }

  return {
    name: "",
    email: "",
    role: "User",
    status: "Active",
  };
};

const AccountFormModal: React.FC<AccountFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const isEditMode = !!initialData;
  // 🔥 init state 1 lần duy nhất khi mount
  const [formData, setFormData] = useState(() =>
    getInitialFormData(initialData)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] p-5 lg:p-10">
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {isEditMode ? "Edit Account" : "Add New Account"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isEditMode ? "Update the information for this team member." : "Fill in the information below to add a new team member."}
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div>
          <Label>Name</Label>
          <Input 
            type="text" 
            placeholder="Enter full name" 
            defaultValue={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input 
            type="email" 
            placeholder="Enter email address" 
            defaultValue={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>
        <div>
          <Label>Role</Label>
          {isOpen && (
            <Select
              options={[
                { value: "Admin", label: "Admin" },
                { value: "Editor", label: "Editor" },
                { value: "User", label: "User" },
              ]}
              onChange={(v) => setFormData({...formData, role: v})}
              defaultValue={formData.role}
            />
          )}
        </div>
        <div>
          <Label>Status</Label>
          {isOpen && (
            <Select
              options={[
                { value: "Active", label: "Active" },
                { value: "Pending", label: "Pending" },
                { value: "Banned", label: "Banned" },
              ]}
              onChange={(v) => setFormData({...formData, status: v})}
              defaultValue={formData.status}
            />
          )}
        </div>

        <div className="flex items-center gap-3 justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {isEditMode ? "Save Changes" : "Save Account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AccountFormModal;
