// Order Service - Quản lý orders trong bộ nhớ tạm
export interface OrderItem {
  food_item_id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  special_instructions?: string;
  printer_id?: number | null;
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
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'pending' | 'paid';
  created_at: string;
  updated_at: string;
  employee_id?: number;
  employee_name?: string;
}

class OrderService {
  private orders: Map<string, BuffetOrder> = new Map();
  private orderCounter = 1;

  // Tạo order mới hoặc cập nhật order hiện tại
  createOrUpdateOrder(data: {
    table_id: number;
    table_name: string;
    table_number: string;
    area: string;
    buffet_package_id: number;
    buffet_package_name: string;
    buffet_quantity: number;
    buffet_price: number;
    items: OrderItem[];
    employee_id?: number;
    employee_name?: string;
  }): BuffetOrder {
    const orderKey = `table_${data.table_id}`;
    const existingOrder = this.orders.get(orderKey);

    const now = new Date().toISOString();
    const subtotal = (data.buffet_quantity * data.buffet_price) + 
      data.items.reduce((sum, item) => sum + item.total, 0);
    const tax_amount = subtotal * 0.1;
    const total_amount = subtotal + tax_amount;

    if (existingOrder) {
      // Cập nhật order hiện tại
      const updatedOrder: BuffetOrder = {
        ...existingOrder,
        buffet_quantity: existingOrder.buffet_quantity + data.buffet_quantity,
        items: [...existingOrder.items, ...data.items],
        subtotal: existingOrder.subtotal + subtotal,
        tax_amount: existingOrder.tax_amount + tax_amount,
        total_amount: existingOrder.total_amount + total_amount,
        updated_at: now
      };
      
      this.orders.set(orderKey, updatedOrder);
      return updatedOrder;
    } else {
      // Tạo order mới
      const newOrder: BuffetOrder = {
        id: `BUF-${Date.now()}`,
        table_id: data.table_id,
        table_name: data.table_name,
        table_number: data.table_number,
        area: data.area,
        buffet_package_id: data.buffet_package_id,
        buffet_package_name: data.buffet_package_name,
        buffet_quantity: data.buffet_quantity,
        buffet_price: data.buffet_price,
        items: data.items,
        subtotal,
        tax_amount,
        total_amount,
        status: 'pending',
        created_at: now,
        updated_at: now,
        employee_id: data.employee_id,
        employee_name: data.employee_name
      };
      
      this.orders.set(orderKey, newOrder);
      return newOrder;
    }
  }

  // Lấy order theo table_id
  getOrderByTable(table_id: number): BuffetOrder | null {
    const orderKey = `table_${table_id}`;
    return this.orders.get(orderKey) || null;
  }

  // Lấy tất cả orders
  getAllOrders(): BuffetOrder[] {
    return Array.from(this.orders.values());
  }

  // Lấy orders chưa thanh toán
  getPendingOrders(): BuffetOrder[] {
    return Array.from(this.orders.values()).filter(order => order.status === 'pending');
  }

  // Thanh toán order
  payOrder(table_id: number): BuffetOrder | null {
    const orderKey = `table_${table_id}`;
    const order = this.orders.get(orderKey);
    
    if (order && order.status === 'pending') {
      const paidOrder: BuffetOrder = {
        ...order,
        status: 'paid',
        updated_at: new Date().toISOString()
      };
      
      this.orders.set(orderKey, paidOrder);
      return paidOrder;
    }
    
    return null;
  }

  // Xóa order (sau khi thanh toán)
  removeOrder(table_id: number): boolean {
    const orderKey = `table_${table_id}`;
    return this.orders.delete(orderKey);
  }

  // Xóa tất cả orders
  clearAllOrders(): void {
    this.orders.clear();
  }

  // Lấy thống kê
  getStats() {
    const allOrders = this.getAllOrders();
    const paidOrders = allOrders.filter(order => order.status === 'paid');
    
    return {
      total_orders: allOrders.length,
      pending_orders: allOrders.filter(order => order.status === 'pending').length,
      paid_orders: paidOrders.length,
      total_revenue: paidOrders.reduce((sum, order) => sum + order.total_amount, 0)
    };
  }
}

export const orderService = new OrderService();
