import { useState, useMemo } from "react";
import { Account } from "../types/account";
import { AccountFilters } from "../components/AccountToolbar";

// Generate mock data outside to prevent recreation on re-renders
const generateMockData = (): Account[] => {
  const roles = ["Admin", "Editor", "User"];
  const statuses = ["Active", "Pending", "Banned"];

  return Array.from({ length: 25 }).map((_, index) => ({
    id: index + 1,
    user: {
      image: `/images/user/user-${(index % 10) + 17}.jpg`,
      name: `User Name ${index + 1}`,
      email: `user${index + 1}@example.com`,
    },
    role: roles[index % 3],
    status: statuses[index % 3],
    joinDate: `${(index % 28) + 1} Oct, 2024`,
  }));
};

const initialData = generateMockData();

export const useAccounts = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<AccountFilters>({ role: "", status: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<Account | null>(null);

  // Derived state: Filtered Data
  const filteredData = useMemo(() => {
    return initialData.filter((account) => {
      const matchesSearch =
        account.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = filters.role ? account.role.toLowerCase() === filters.role.toLowerCase() : true;
      const matchesStatus = filters.status ? account.status.toLowerCase() === filters.status.toLowerCase() : true;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [searchQuery, filters]);

  // Derived state: Paginated Data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFilters = (newFilters: AccountFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleItemsPerPage = (n: number) => {
    setItemsPerPage(n);
    setCurrentPage(1);
  };

  return {
    isModalOpen,
    setIsModalOpen,
    searchQuery,
    filters,
    handleSearch,      
    handleFilters,     
    handleItemsPerPage,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    editAccount,
    setEditAccount,
    deleteAccount,
    setDeleteAccount,
    filteredData,
    paginatedData,
    totalPages,
  };
};
