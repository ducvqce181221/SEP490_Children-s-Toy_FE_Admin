export interface Account {
  id: number;
  user: {
    image: string;
    name: string;
    email: string;
  };
  role: string;
  status: string;
  joinDate: string;
}

export interface AccountFormData {
  name: string;
  email: string;
  role: string;
  status: string;
}
