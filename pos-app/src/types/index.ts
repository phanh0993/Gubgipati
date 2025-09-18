export interface Employee {
  id: number;
  employee_code: string;
  fullname: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
}

export interface Table {
  id: number;
  table_name: string;
  table_number: string;
  area: string;
  capacity: number;
  status: 'empty' | 'busy';
}

export interface BuffetPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
}

export interface BuffetPackageItem {
  id: number;
  package_id: number;
  food_item_id: number;
  is_unlimited: boolean;
  max_quantity?: number;
  food_item: {
    id: number;
    name: string;
    price: number;
    description: string;
    image_url?: string;
  };
}

export interface OrderItem {
  id: number;
  food_item_id: number;
  quantity: number;
  food_item: {
    id: number;
    name: string;
    price: number;
    description: string;
    image_url?: string;
  };
}

export interface BuffetOrder {
  id: string;
  table_id: number;
  table_name: string;
  table_number: string;
  area: string;
  buffet_package_id: number;
  buffet_package_name: string;
  buffet_quantity: number;
  buffet_price: number;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'paid';
  created_at: string;
  employee_id: number;
  employee_name: string;
}

export interface AuthContextType {
  employee: Employee | null;
  login: (employeeCode: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

